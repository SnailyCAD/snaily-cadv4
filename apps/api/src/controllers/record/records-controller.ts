import { ContentType, Delete, Description, Get, Header, Post, Put } from "@tsed/schema";
import {
  CREATE_TICKET_SCHEMA,
  CREATE_WARRANT_SCHEMA,
  UPDATE_WARRANT_SCHEMA,
  CREATE_TICKET_SCHEMA_BUSINESS,
} from "@snailycad/schemas";
import { QueryParams, BodyParams, Context, PathParams } from "@tsed/platform-params";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "lib/data/prisma";
import { UseBeforeEach, UseBefore } from "@tsed/platform-middlewares";
import { ActiveOfficer } from "middlewares/active-officer";
import { Controller } from "@tsed/di";
import { IsAuth } from "middlewares/auth/is-auth";
import {
  type Citizen,
  Feature,
  type Record as CADRecord,
  type Violation,
  type Warrant,
  WarrantStatus,
  WhitelistStatus,
  DiscordWebhookType,
  type CombinedLeoUnit,
  type User,
  type Business,
  PaymentStatus,
  type RecordType,
  PublishStatus,
} from "@prisma/client";
import { validateSchema } from "lib/data/validate-schema";
import { combinedUnitProperties, leoProperties } from "utils/leo/includes";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import { isFeatureEnabled } from "lib/upsert-cad";
import { sendDiscordWebhook, sendRawWebhook } from "lib/discord/webhooks";
import { getUserOfficerFromActiveOfficer, getInactivityFilter } from "lib/leo/utils";
import type * as APITypes from "@snailycad/types/api";
import { officerOrDeputyToUnit } from "lib/leo/officerOrDeputyToUnit";
import { Socket } from "services/socket-service";
import { assignUnitsToWarrant } from "~/lib/leo/records/assign-units-to-warrant";
import type { MiscCadSettings, Officer, cad } from "@snailycad/types";
import { userProperties } from "lib/auth/getSessionUser";
import { upsertRecord } from "~/lib/leo/records/upsert-record";
import { IsFeatureEnabled } from "middlewares/is-enabled";
import { getTranslator } from "utils/get-translator";
import ejs from "ejs";
import { resolve } from "node:path";
import format from "date-fns/format";
import differenceInYears from "date-fns/differenceInYears";
import { recordsInclude } from "../leo/search/SearchController";
import { citizenInclude } from "../citizen/CitizenController";
import { generateCallsign } from "@snailycad/utils";
import { type Descendant, slateDataToString } from "@snailycad/utils/editor";
import puppeteer from "puppeteer";
import { AuditLogActionType, createAuditLogEntry } from "@snailycad/audit-logger/server";
import { captureException } from "@sentry/node";
import { shouldCheckCitizenUserId } from "~/lib/citizen/has-citizen-access";

export const assignedOfficersInclude = {
  combinedUnit: { include: combinedUnitProperties },
  officer: { include: leoProperties },
};

@UseBeforeEach(IsAuth)
@Controller("/records")
@ContentType("application/json")
export class RecordsController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/drafts")
  @Description("Get draft records that a user created")
  async getUserDraftRecords(
    @Context("user") user: User,
    @Context("cad") cad: cad & { features: Record<Feature, boolean> },
    @QueryParams("type") type: string,
  ) {
    const isEnabled = isFeatureEnabled({
      feature: Feature.CITIZEN_RECORD_APPROVAL,
      features: cad.features,
      defaultReturn: false,
    });

    const draftRecords = await prisma.record.findMany({
      take: 12,
      where: {
        publishStatus: "DRAFT",
        officer: { userId: user.id },
        type: type as RecordType,
      },
      include: recordsInclude(isEnabled).include,
    });

    return draftRecords as APITypes.GetCitizenByIdRecordsData;
  }

  @Delete("/drafts/:id")
  async deleteDraftRecordById(@Context("user") user: User, @PathParams("id") id: string) {
    const record = await prisma.record
      .delete({
        where: {
          id,
          officer: { userId: user.id },
        },
      })
      .catch(() => null);

    return !!record;
  }

  @Get("/active-warrants")
  @Description("Get all active warrants (ACTIVE_WARRANTS must be enabled)")
  @IsFeatureEnabled({ feature: Feature.ACTIVE_WARRANTS })
  async getActiveWarrants(
    @Context("cad") cad: cad,
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("includeAll", Boolean) includeAll = false,
  ): Promise<APITypes.GetActiveWarrantsData> {
    const inactivityFilter = getInactivityFilter(cad, "activeWarrantsInactivityTimeout");

    const where = {
      status: "ACTIVE",
      approvalStatus: "ACCEPTED",
      ...(inactivityFilter?.filter ?? {}),
    } as const;

    const [totalCount, activeWarrants] = await prisma.$transaction([
      prisma.warrant.count({ where }),
      prisma.warrant.findMany({
        orderBy: { updatedAt: "desc" },
        where,
        take: includeAll ? undefined : 12,
        skip: includeAll ? undefined : skip,
        include: {
          citizen: true,
          assignedOfficers: { include: assignedOfficersInclude },
        },
      }),
    ]);

    return {
      totalCount,
      activeWarrants: activeWarrants.map((warrant) => officerOrDeputyToUnit(warrant)),
    };
  }

  @UseBefore(ActiveOfficer)
  @Post("/create-warrant")
  @Description("Create a new warrant")
  @UsePermissions({
    permissions: [Permissions.ManageWarrants, Permissions.DeleteCitizenRecords],
  })
  async createWarrant(
    @Context("cad") cad: { features?: Record<Feature, boolean> },
    @Context("user") user: User,
    @BodyParams() body: unknown,
    @Context("activeOfficer") activeOfficer: (CombinedLeoUnit & { officers: Officer[] }) | Officer,
  ): Promise<APITypes.PostCreateWarrantData> {
    const data = validateSchema(CREATE_WARRANT_SCHEMA, body);
    const officer = getUserOfficerFromActiveOfficer({
      userId: user.id,
      activeOfficer,
      allowDispatch: true,
    });

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: data.citizenId,
      },
    });

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    const isWarrantApprovalEnabled = isFeatureEnabled({
      feature: Feature.WARRANT_STATUS_APPROVAL,
      features: cad.features,
      defaultReturn: false,
    });

    const approvalStatus =
      data.status === "ACTIVE" && isWarrantApprovalEnabled
        ? WhitelistStatus.PENDING
        : WhitelistStatus.ACCEPTED;

    const warrant = await prisma.warrant.create({
      data: {
        citizenId: citizen.id,
        officerId: officer?.id ?? data.officerId ?? null,
        description: data.description,
        status: data.status as WarrantStatus,
        approvalStatus,
      },
    });

    await assignUnitsToWarrant({
      socket: this.socket,
      warrantId: warrant.id,
      unitIds: (data.assignedOfficers ?? []) as string[],
    });

    const updatedWarrant = await prisma.warrant.findUniqueOrThrow({
      where: { id: warrant.id },
      include: {
        citizen: { include: { user: { select: userProperties } } },
        officer: true,
        assignedOfficers: { include: assignedOfficersInclude },
      },
    });

    await this.handleDiscordWebhook(updatedWarrant, DiscordWebhookType.WARRANTS, user.locale);

    await prisma.recordLog.create({
      data: {
        citizenId: citizen.id,
        warrantId: warrant.id,
      },
    });

    if (approvalStatus === WhitelistStatus.PENDING) {
      throw new BadRequest("warrantApprovalRequired");
    }

    const normalizedWarrant = officerOrDeputyToUnit(updatedWarrant);
    this.socket.emitCreateActiveWarrant(normalizedWarrant);

    return normalizedWarrant;
  }

  @Post("/pdf/record/:id")
  @Description("Export a record to a PDF file.")
  @UsePermissions({
    permissions: [Permissions.Leo],
  })
  @Header("Content-Type", "application/pdf")
  async exportRecordToPDF(
    @PathParams("id") id: string,
    @Context("cad")
    cad: cad & { miscCadSettings: MiscCadSettings; features: Record<Feature, boolean> },
    @Context("user") user: User,
  ) {
    const isEnabled = isFeatureEnabled({
      feature: Feature.CITIZEN_RECORD_APPROVAL,
      features: cad.features,
      defaultReturn: false,
    });
    const record = await prisma.record.findUnique({
      where: { id },
      include: { ...recordsInclude(isEnabled).include, citizen: { include: citizenInclude } },
    });

    if (!record) {
      throw new NotFound("recordNotFound");
    }

    if (!record.citizen) {
      throw new BadRequest("recordNotAssociatedWithCitizen");
    }

    const root = __dirname;
    const templatePath = resolve(root, "../../templates/record.ejs");
    const age = record.citizen?.dateOfBirth ? calculateAge(record.citizen.dateOfBirth) : "";

    const unitName = record.officer
      ? `${record.officer.citizen.name} ${record.officer.citizen.surname}`
      : "";
    const officerCallsign = record.officer
      ? generateCallsign(record.officer, cad.miscCadSettings.callsignTemplate)
      : "";

    const officer = record.officer ? `${officerCallsign} ${unitName}` : "";
    const formattedDescription = slateDataToString(
      record.descriptionData as unknown[] as Descendant[],
    );

    const translator = await getTranslator({
      type: "webhooks",
      locale: user.locale,
      namespace: "Records",
    });

    const template = await ejs.renderFile(templatePath, {
      formatDate,
      officer,
      age,
      record,
      formattedDescription,
      translator,
    });

    try {
      const args = process.env.IS_USING_ROOT_USER === "true" ? ["--no-sandbox"] : [];
      const browser = await puppeteer.launch({ args, headless: true });
      const page = await browser.newPage();

      page.setContent(template, { waitUntil: "domcontentloaded" });

      await page.emulateMediaType("screen");

      const pdf = await page.pdf({
        format: "letter",
        printBackground: true,
        scale: 0.8,
        preferCSSPageSize: true,
      });

      return pdf;
    } catch (err) {
      console.log(err);
      captureException(err);
      return null;
    }
  }

  @Post("/pdf/citizen/:id")
  @UseBefore(ActiveOfficer)
  @Description("Export an entire citizen record to a PDF file.")
  @UsePermissions({
    permissions: [Permissions.Leo],
  })
  @Header("Content-Type", "application/pdf")
  async exportCitizenCriminalRecordToPDF(
    @PathParams("id") citizenId: string,
    @Context("cad")
    cad: cad & { miscCadSettings: MiscCadSettings; features: Record<Feature, boolean> },
    @Context("user") user: User,
    @Context("activeOfficer") activeOfficer: (CombinedLeoUnit & { officers: Officer[] }) | Officer,
  ) {
    const isEnabled = isFeatureEnabled({
      feature: Feature.CITIZEN_RECORD_APPROVAL,
      features: cad.features,
      defaultReturn: false,
    });

    const officer = getUserOfficerFromActiveOfficer({
      userId: user.id,
      activeOfficer,
      allowDispatch: true,
    });

    const citizen = await prisma.citizen.findUnique({
      where: { id: citizenId },
      include: citizenInclude,
    });

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    const records = await prisma.record.findMany({
      where: { citizenId: citizen.id, publishStatus: PublishStatus.PUBLISHED },
      include: recordsInclude(isEnabled).include,
    });

    const root = __dirname;
    const templatePath = resolve(root, "../../templates/citizen-criminal-record.ejs");

    const translator = await getTranslator({
      type: "webhooks",
      locale: user.locale,
      namespace: "Records",
    });

    function formatOfficer(officer: Officer) {
      const unitName = officer ? `${officer.citizen.name} ${officer.citizen.surname}` : "";
      const officerCallsign = officer
        ? generateCallsign(officer, cad.miscCadSettings.callsignTemplate)
        : "";

      return `${officerCallsign} ${unitName}`;
    }

    const template = await ejs.renderFile(templatePath, {
      formatDate,
      formatOfficer,
      slateDataToString,
      sumOf,
      age: calculateAge(citizen.dateOfBirth),
      citizen,
      officer: officer ? formatOfficer(officer as Officer) : "Dispatch",
      dateOfExport: Date.now(),
      records,
      translator,
    });

    try {
      const args = process.env.IS_USING_ROOT_USER === "true" ? ["--no-sandbox"] : [];
      const browser = await puppeteer.launch({ args, headless: true });
      const page = await browser.newPage();

      page.setContent(template, { waitUntil: "domcontentloaded" });

      await page.emulateMediaType("screen");

      const pdf = await page.pdf({
        format: "letter",
        printBackground: true,
        scale: 0.8,
        preferCSSPageSize: true,
      });

      return pdf;
    } catch (err) {
      console.log(err);
      captureException(err);
      return null;
    }
  }

  @UseBefore(ActiveOfficer)
  @Put("/warrant/:id")
  @Description("Update a warrant by its id")
  @UsePermissions({
    permissions: [Permissions.Leo],
  })
  async updateWarrant(
    @BodyParams() body: unknown,
    @PathParams("id") warrantId: string,
  ): Promise<APITypes.PutWarrantsData> {
    const data = validateSchema(UPDATE_WARRANT_SCHEMA, body);

    const warrant = await prisma.warrant.findUnique({
      where: { id: warrantId },
      include: { assignedOfficers: true },
    });

    if (!warrant) {
      throw new NotFound("warrantNotFound");
    }

    await prisma.$transaction(
      warrant.assignedOfficers.map(({ id }) =>
        prisma.assignedWarrantOfficer.delete({
          where: { id },
        }),
      ),
    );

    await assignUnitsToWarrant({
      socket: this.socket,
      warrantId: warrant.id,
      unitIds: (data.assignedOfficers ?? []) as string[],
    });

    const updated = await prisma.warrant.update({
      where: { id: warrantId },
      data: {
        status: data.status as WarrantStatus,
        description: data.description ?? warrant.description,
        citizenId: data.citizenId ?? warrant.citizenId,
      },
      include: {
        citizen: true,
        assignedOfficers: { include: assignedOfficersInclude },
      },
    });

    const normalizedWarrant = officerOrDeputyToUnit(updated);
    if (warrant.status === WarrantStatus.ACTIVE) {
      this.socket.emitUpdateActiveWarrant(normalizedWarrant);
    }

    return normalizedWarrant;
  }

  @UseBefore(ActiveOfficer)
  @Post("/")
  @Description("Create a new ticket, written warning or arrest report to a citizen")
  @UsePermissions({
    permissions: [Permissions.Leo],
  })
  async createTicket(
    @BodyParams() body: unknown,
    @Context("cad") cad: { features?: Record<Feature, boolean> },
    @Context("activeOfficer") activeOfficer: (CombinedLeoUnit & { officers: Officer[] }) | Officer,
    @Context("sessionUserId") sessionUserId: string,
  ): Promise<APITypes.PostRecordsData> {
    const data = validateSchema(CREATE_TICKET_SCHEMA.or(CREATE_TICKET_SCHEMA_BUSINESS), body);
    const officer = getUserOfficerFromActiveOfficer({
      userId: sessionUserId,
      activeOfficer,
      allowDispatch: true,
    });

    const recordItem = await upsertRecord({
      data,
      cad,
      officerId: officer?.id ?? data.officerId ?? null,
      recordId: null,
    });

    await prisma.recordLog.create({
      data: {
        citizenId: recordItem.citizenId ?? undefined,
        businessId: recordItem.businessId ?? undefined,
        recordId: recordItem.id,
      },
    });

    // Only send a Discord webhook if the record is published
    if (recordItem.publishStatus === PublishStatus.PUBLISHED) {
      await this.handleDiscordWebhook(recordItem as any);
    }

    return recordItem;
  }

  @UseBefore(ActiveOfficer)
  @Put("/record/:id")
  @Description("Update a ticket, written warning or arrest report by its id")
  @UsePermissions({
    permissions: [Permissions.Leo],
  })
  async updateRecordById(
    @Context("cad") cad: { features?: Record<Feature, boolean> },
    @BodyParams() body: unknown,
    @PathParams("id") recordId: string,
  ): Promise<APITypes.PutRecordsByIdData> {
    const data = validateSchema(CREATE_TICKET_SCHEMA.or(CREATE_TICKET_SCHEMA_BUSINESS), body);

    const recordItem = await upsertRecord({
      data,
      cad,
      recordId,
    });

    return recordItem;
  }

  @Post("/mark-as-paid/:id")
  @Description("Allow a citizen to mark a record as paid")
  @IsFeatureEnabled({
    feature: Feature.CITIZEN_RECORD_PAYMENTS,
  })
  async markRecordAsPaid(
    @Context("cad") cad: { features?: Record<Feature, boolean> },
    @Context("user") user: User,
    @PathParams("id") recordId: string,
  ): Promise<APITypes.PutRecordsByIdData> {
    const checkCitizenUserId = shouldCheckCitizenUserId({ cad, user });

    const citizen = await prisma.citizen.findFirst({
      where: {
        userId: checkCitizenUserId ? user.id : undefined,
        Record: { some: { id: recordId } },
      },
    });

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    const record = await prisma.record.findUnique({
      where: { id: recordId },
    });

    if (!record) {
      throw new NotFound("recordNotFound");
    }

    const isEnabled = isFeatureEnabled({
      feature: Feature.CITIZEN_RECORD_APPROVAL,
      features: cad.features,
      defaultReturn: false,
    });

    const updatedRecord = await prisma.record.update({
      where: { id: recordId },
      data: {
        paymentStatus: PaymentStatus.PAID,
      },
      include: recordsInclude(isEnabled).include,
    });

    return updatedRecord;
  }

  @UseBefore(ActiveOfficer)
  @Delete("/:id")
  @Description("Delete a warrant, ticket, written warning or arrest report by its id")
  @UsePermissions({
    permissions: [Permissions.Leo],
  })
  async deleteRecord(
    @PathParams("id") id: string,
    @BodyParams("type") type: "WARRANT" | (string & {}),
    @Context("sessionUserId") sessionUserId: string,
  ): Promise<APITypes.DeleteRecordsByIdData> {
    if (type === "WARRANT") {
      const warrant = await prisma.warrant.findUnique({
        where: { id },
      });

      if (!warrant) {
        throw new NotFound("warrantNotFound");
      }
    } else {
      const record = await prisma.record.findUnique({
        where: { id },
      });

      if (!record) {
        throw new NotFound("recordNotFound");
      }
    }

    const name = type === "WARRANT" ? "warrant" : "record";

    // @ts-expect-error simple shortcut
    await prisma[name].delete({
      where: { id },
    });

    const auditLogType =
      type === "WARRANT"
        ? AuditLogActionType.CitizenWarrantRemove
        : AuditLogActionType.CitizenRecordRemove;

    await createAuditLogEntry({
      prisma,
      executorId: sessionUserId,
      action: {
        type: auditLogType,
        new: id,
      },
    });

    return true;
  }

  private async handleDiscordWebhook(
    ticket: (
      | (CADRecord & { violations: (Violation & { penalCode: { title: string } })[] })
      | Warrant
    ) & {
      citizen?: Citizen & { user?: Pick<User, "discordId"> | null };
      business?: Business;
    },
    type: DiscordWebhookType = DiscordWebhookType.CITIZEN_RECORD,
    locale?: string | null,
  ) {
    try {
      const data = await createWebhookData(ticket, locale);
      await sendDiscordWebhook({
        type,
        data,
        extraMessageData: { userDiscordId: ticket.citizen?.user?.discordId },
      });
      await sendRawWebhook({
        type: DiscordWebhookType.CITIZEN_RECORD,
        data: ticket,
      });
    } catch (error) {
      console.error("Could not send Discord webhook.", error);
    }
  }
}

async function createWebhookData(
  data: (
    | (CADRecord & { violations: (Violation & { penalCode: { title: string } })[] })
    | Warrant
  ) & {
    citizen?: Citizen & { user?: Pick<User, "discordId"> | null };
    business?: Business;
  },
  locale?: string | null,
) {
  const t = await getTranslator({ type: "webhooks", locale, namespace: "Records" });

  const isWarrant = !("notes" in data);
  const citizen = data.citizen
    ? `${data.citizen.name} ${data.citizen.surname}`
    : data.business
      ? data.business.name
      : "Unknown";

  const description = !isWarrant ? data.notes : "";

  const totalJailTime = getTotal("jailTime");
  const totalBail = getTotal("bail");
  const totalFines = getTotal("fine");

  const fields = [{ name: t("citizen"), value: citizen, inline: true }];

  if (isWarrant) {
    fields.push({ name: t("status"), value: t(data.status), inline: true });
  } else {
    fields.push(
      { name: t("postal"), value: data.postal || "-", inline: true },
      { name: t("recordType"), value: t(data.type), inline: true },
      { name: t("totalFineAmount"), value: totalFines, inline: true },
      { name: t("totalJailTime"), value: totalJailTime, inline: true },
      { name: t("totalBail"), value: totalBail, inline: true },
      {
        name: t("violations"),
        value: data.violations.map((v) => `\`${v.penalCode.title}\``).join(", "),
        inline: false,
      },
    );
  }

  return {
    embeds: [
      {
        title: isWarrant ? t("newWarrantCreated") : t("newRecordCreated"),
        description: description || undefined,
        fields,
      },
    ],
  };

  function getTotal(name: "jailTime" | "fine" | "bail") {
    const total = !isWarrant
      ? data.violations.reduce((ac, cv) => {
          const count = (name === "fine" && cv.counts) || 1;
          return ac + (cv[name] || 0) * count;
        }, 0)
      : 0;

    return String(total);
  }
}

// todo: copied from client/lib/utils.
// lets share these somehow
function calculateAge(dateOfBirth: string | Date): string {
  const difference = differenceInYears(new Date(), new Date(dateOfBirth));
  return String(difference);
}

function formatDate(date: string | Date | number, options?: { onlyDate: boolean }) {
  const dateObj = new Date(date);
  const hmsString = options?.onlyDate ? "" : " HH:mm:ss";
  return format(dateObj, `yyyy-MM-dd${hmsString}`);
}

function sumOf(violations: Violation[], type: "fine" | "jailTime" | "bail") {
  let sum = 0;

  for (const violation of violations) {
    const counts = violation.counts || 1;
    const fine = violation[type];

    if (fine) {
      sum += fine * counts;
    }
  }

  return Intl.NumberFormat("en-BE").format(sum);
}
