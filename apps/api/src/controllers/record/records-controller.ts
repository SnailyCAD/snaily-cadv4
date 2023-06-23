import {
  CREATE_TICKET_SCHEMA,
  CREATE_WARRANT_SCHEMA,
  UPDATE_WARRANT_SCHEMA,
  CREATE_TICKET_SCHEMA_BUSINESS,
} from "@snailycad/schemas";
import { prisma } from "lib/data/prisma";
import { ActiveOfficer } from "middlewares/active-officer";
import { AuthGuard } from "middlewares/auth/is-auth";
import {
  Citizen,
  Feature,
  Record as CADRecord,
  Violation,
  Warrant,
  WarrantStatus,
  WhitelistStatus,
  DiscordWebhookType,
  CombinedLeoUnit,
  Officer,
  User,
  Business,
} from "@prisma/client";
import { validateSchema } from "lib/data/validate-schema";
import { combinedUnitProperties, leoProperties } from "utils/leo/includes";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import { isFeatureEnabled } from "lib/upsert-cad";
import { sendDiscordWebhook, sendRawWebhook } from "lib/discord/webhooks";
import { getFirstOfficerFromActiveOfficer, getInactivityFilter } from "lib/leo/utils";
import type * as APITypes from "@snailycad/types/api";
import { officerOrDeputyToUnit } from "lib/leo/officerOrDeputyToUnit";
import { Socket } from "services/socket-service";
import { assignUnitsToWarrant } from "~/lib/leo/records/assign-units-to-warrant";
import type { cad } from "@snailycad/types";
import { userProperties } from "lib/auth/getSessionUser";
import { upsertRecord } from "~/lib/leo/records/upsert-record";
import { IsFeatureEnabled } from "middlewares/is-enabled";
import { getTranslator } from "utils/get-translator";
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Description } from "~/decorators/description";
import { Cad } from "~/decorators/cad";
import { SessionUser } from "~/decorators/user";

export const assignedOfficersInclude = {
  combinedUnit: { include: combinedUnitProperties },
  officer: { include: leoProperties },
};

@UseGuards(AuthGuard)
@Controller("/records")
export class RecordsController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/active-warrants")
  @Description("Get all active warrants (ACTIVE_WARRANTS must be enabled)")
  @IsFeatureEnabled({ feature: Feature.ACTIVE_WARRANTS })
  async getActiveWarrants(
    @Cad() cad: cad,
    @Query("skip") skip = 0,
    @Query("includeAll") includeAll = false,
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

  @UseGuards(ActiveOfficer)
  @Post("/create-warrant")
  @Description("Create a new warrant")
  @UsePermissions({
    permissions: [Permissions.ManageWarrants, Permissions.DeleteCitizenRecords],
  })
  async createWarrant(
    @Cad() cad: { features?: Record<Feature, boolean> },
    @SessionUser() user: User,
    @Body() body: unknown,
    @Context("activeOfficer") activeOfficer: (CombinedLeoUnit & { officers: Officer[] }) | Officer,
  ): Promise<APITypes.PostCreateWarrantData> {
    const data = validateSchema(CREATE_WARRANT_SCHEMA, body);
    const officer = getFirstOfficerFromActiveOfficer({ activeOfficer, allowDispatch: true });

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: data.citizenId,
      },
    });

    if (!citizen) {
      throw new NotFoundException("citizenNotFound");
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
        officerId: officer?.id ?? null,
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
      throw new BadRequestException("warrantApprovalRequired");
    }

    const normalizedWarrant = officerOrDeputyToUnit(updatedWarrant);
    this.socket.emitCreateActiveWarrant(normalizedWarrant);

    return normalizedWarrant;
  }

  @UseGuards(ActiveOfficer)
  @Put("/warrant/:id")
  @Description("Update a warrant by its id")
  @UsePermissions({
    permissions: [Permissions.Leo],
  })
  async updateWarrant(
    @Body() body: unknown,
    @Param("id") warrantId: string,
  ): Promise<APITypes.PutWarrantsData> {
    const data = validateSchema(UPDATE_WARRANT_SCHEMA, body);

    const warrant = await prisma.warrant.findUnique({
      where: { id: warrantId },
      include: { assignedOfficers: true },
    });

    if (!warrant) {
      throw new NotFoundException("warrantNotFound");
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

  @UseGuards(ActiveOfficer)
  @Post("/")
  @Description("Create a new ticket, written warning or arrest report to a citizen")
  @UsePermissions({
    permissions: [Permissions.Leo],
  })
  async createTicket(
    @Body() body: unknown,
    @Cad() cad: { features?: Record<Feature, boolean> },
    @Context("activeOfficer") activeOfficer: (CombinedLeoUnit & { officers: Officer[] }) | Officer,
  ): Promise<APITypes.PostRecordsData> {
    const data = validateSchema(CREATE_TICKET_SCHEMA.or(CREATE_TICKET_SCHEMA_BUSINESS), body);
    const officer = getFirstOfficerFromActiveOfficer({ activeOfficer, allowDispatch: true });

    const recordItem = await upsertRecord({
      data,
      cad,
      officer,
      recordId: null,
    });

    await prisma.recordLog.create({
      data: {
        citizenId: recordItem.citizenId ?? undefined,
        businessId: recordItem.businessId ?? undefined,
        recordId: recordItem.id,
      },
    });

    await this.handleDiscordWebhook(recordItem as any);

    return recordItem;
  }

  @UseGuards(ActiveOfficer)
  @Put("/record/:id")
  @Description("Update a ticket, written warning or arrest report by its id")
  @UsePermissions({
    permissions: [Permissions.Leo],
  })
  async updateRecordById(
    @Context("cad") cad: { features?: Record<Feature, boolean> },
    @Body() body: unknown,
    @Param("id") recordId: string,
  ): Promise<APITypes.PutRecordsByIdData> {
    const data = validateSchema(CREATE_TICKET_SCHEMA.or(CREATE_TICKET_SCHEMA_BUSINESS), body);

    const recordItem = await upsertRecord({
      data,
      cad,
      recordId,
      officer: null,
    });

    return recordItem;
  }

  @UseGuards(ActiveOfficer)
  @Delete("/:id")
  @Description("Delete a ticket, written warning or arrest report by its id")
  @UsePermissions({
    permissions: [Permissions.Leo],
  })
  async deleteRecord(
    @Param("id") id: string,
    @Body("type") type: "WARRANT" | (string & {}),
  ): Promise<APITypes.DeleteRecordsByIdData> {
    if (type === "WARRANT") {
      const warrant = await prisma.warrant.findUnique({
        where: { id },
      });

      if (!warrant) {
        throw new NotFoundException("warrantNotFound");
      }
    } else {
      const record = await prisma.record.findUnique({
        where: { id },
      });

      if (!record) {
        throw new NotFoundException("recordNotFound");
      }
    }

    const name = type === "WARRANT" ? "warrant" : "record";

    // @ts-expect-error simple shortcut
    await prisma[name].delete({
      where: { id },
    });

    return true;
  }

  private async handleDiscordWebhook(
    ticket: ((CADRecord & { violations: Violation[] }) | Warrant) & {
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
  data: ((CADRecord & { violations: Violation[] }) | Warrant) & {
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

  const fields = [
    {
      name: t("citizen"),
      value: citizen,
      inline: true,
    },
  ];

  if (isWarrant) {
    fields.push({ name: t("status"), value: t(data.status), inline: true });
  } else {
    fields.push(
      { name: t("postal"), value: data.postal || "-", inline: true },
      { name: t("recordType"), value: t(data.type), inline: true },
      { name: t("totalBail"), value: totalBail, inline: true },
      { name: t("totalFineAmount"), value: totalFines, inline: true },
      { name: t("totalJailTime"), value: totalJailTime, inline: true },
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
          return ac + (cv[name] || 0);
        }, 0)
      : 0;

    return String(total);
  }
}
