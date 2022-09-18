import { Delete, Description, Get, Post, Put } from "@tsed/schema";
import type { z } from "zod";
import {
  CREATE_TICKET_SCHEMA,
  CREATE_WARRANT_SCHEMA,
  UPDATE_WARRANT_SCHEMA,
} from "@snailycad/schemas";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { UseBeforeEach, UseBefore } from "@tsed/platform-middlewares";
import { ActiveOfficer } from "middlewares/ActiveOfficer";
import { Controller } from "@tsed/di";
import { IsAuth } from "middlewares/IsAuth";
import {
  Citizen,
  Feature,
  Record,
  RecordType,
  SeizedItem,
  Violation,
  Warrant,
  WarrantStatus,
  WhitelistStatus,
  DiscordWebhookType,
  CombinedLeoUnit,
  Officer,
  PaymentStatus,
} from "@prisma/client";
import { validateSchema } from "lib/validateSchema";
import { validateRecordData } from "lib/records/validateRecordData";
import { combinedUnitProperties, leoProperties } from "lib/leo/activeOfficer";
import { ExtendedNotFound } from "src/exceptions/ExtendedNotFound";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import { isFeatureEnabled } from "lib/cad";
import { sendDiscordWebhook } from "lib/discord/webhooks";
import { getFirstOfficerFromActiveOfficer, getInactivityFilter } from "lib/leo/utils";
import type * as APITypes from "@snailycad/types/api";
import { officerOrDeputyToUnit } from "lib/leo/officerOrDeputyToUnit";
import { Socket } from "services/SocketService";
import { assignUnitsToWarrant } from "lib/records/assignToWarrant";
import type { cad } from "@snailycad/types";

export const assignedOfficersInclude = {
  combinedUnit: { include: combinedUnitProperties },
  officer: { include: leoProperties },
};

@UseBeforeEach(IsAuth)
@Controller("/records")
export class RecordsController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/active-warrants")
  @Description("Get all active warrants (ACTIVE_WARRANTS must be enabled)")
  async getActiveWarrants(@Context("cad") cad: cad) {
    const inactivityFilter = getInactivityFilter(cad, "activeWarrantsInactivityTimeout");
    if (inactivityFilter) {
      this.endInactiveWarrants(inactivityFilter.updatedAt);
    }

    const activeWarrants = await prisma.warrant.findMany({
      orderBy: { updatedAt: "desc" },
      where: { status: "ACTIVE", approvalStatus: "ACCEPTED", ...(inactivityFilter?.filter ?? {}) },
      include: {
        citizen: true,
        assignedOfficers: { include: assignedOfficersInclude },
      },
    });

    return activeWarrants.map((warrant) => officerOrDeputyToUnit(warrant));
  }

  @UseBefore(ActiveOfficer)
  @Post("/create-warrant")
  @Description("Create a new warrant")
  @UsePermissions({
    fallback: (u) => u.isLeo || u.isSupervisor,
    permissions: [Permissions.ManageWarrants, Permissions.DeleteCitizenRecords],
  })
  async createWarrant(
    @Context("cad") cad: cad,
    @BodyParams() body: unknown,
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
        citizen: true,
        officer: true,
        assignedOfficers: { include: assignedOfficersInclude },
      },
    });

    await this.handleDiscordWebhook(updatedWarrant, DiscordWebhookType.WARRANTS);

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

  @UseBefore(ActiveOfficer)
  @Put("/warrant/:id")
  @Description("Update a warrant by its id")
  @UsePermissions({
    fallback: (u) => u.isLeo,
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
  @Description("Create a new ticket, written warning or arrest report")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async createTicket(
    @BodyParams() body: unknown,
    @Context("cad") cad: cad,
    @Context("activeOfficer") activeOfficer: (CombinedLeoUnit & { officers: Officer[] }) | Officer,
  ): Promise<APITypes.PostRecordsData> {
    const data = validateSchema(CREATE_TICKET_SCHEMA, body);
    const officer = getFirstOfficerFromActiveOfficer({ activeOfficer, allowDispatch: true });

    const recordItem = await this.upsertRecord({
      data,
      cad,
      officer,
      recordId: null,
    });

    await prisma.recordLog.create({
      data: { citizenId: recordItem.citizenId, recordId: recordItem.id },
    });

    await this.handleDiscordWebhook(recordItem);

    return recordItem;
  }

  @UseBefore(ActiveOfficer)
  @Put("/record/:id")
  @Description("Update a ticket, written warning or arrest report by its id")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async updateRecordById(
    @Context("cad") cad: cad,
    @BodyParams() body: unknown,
    @PathParams("id") recordId: string,
  ): Promise<APITypes.PutRecordsByIdData> {
    const data = validateSchema(CREATE_TICKET_SCHEMA, body);

    const recordItem = await this.upsertRecord({
      data,
      cad,
      recordId,
      officer: null,
    });

    return recordItem;
  }

  @UseBefore(ActiveOfficer)
  @Delete("/:id")
  @Description("Delete a ticket, written warning or arrest report by its id")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async deleteRecord(
    @PathParams("id") id: string,
    @BodyParams("type") type: "WARRANT" | (string & {}),
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

    return true;
  }

  private async upsertRecord({
    data,
    cad,
    recordId,
    officer,
  }: {
    data: z.infer<typeof CREATE_TICKET_SCHEMA>;
    recordId: string | null;
    cad: cad;
    officer: Officer | null;
  }) {
    if (recordId) {
      const record = await prisma.record.findUnique({
        where: { id: recordId },
        include: { violations: true, seizedItems: true },
      });

      if (!record) {
        throw new NotFound("notFound");
      }

      await Promise.all([
        unlinkViolations(record.violations),
        unlinkSeizedItems(record.seizedItems),
      ]);
    }

    const citizen = await prisma.citizen.findUnique({
      where: { id: data.citizenId },
    });

    if (!citizen) {
      throw new ExtendedNotFound({ citizenId: "citizenNotFound" });
    }

    const isApprovalEnabled = isFeatureEnabled({
      defaultReturn: false,
      feature: Feature.CITIZEN_RECORD_APPROVAL,
      features: cad.features,
    });
    const recordStatus = isApprovalEnabled ? WhitelistStatus.PENDING : WhitelistStatus.ACCEPTED;

    const ticket = await prisma.record.upsert({
      where: { id: String(recordId) },
      create: {
        type: data.type as RecordType,
        citizenId: citizen.id,
        officerId: officer?.id ?? null,
        notes: data.notes,
        postal: String(data.postal),
        status: recordStatus,
        paymentStatus: (data.paymentStatus ?? null) as PaymentStatus | null,
      },
      update: {
        notes: data.notes,
        postal: data.postal,
        paymentStatus: (data.paymentStatus ?? null) as PaymentStatus | null,
      },
      include: { officer: { include: leoProperties }, citizen: true },
    });

    if (ticket.type === "ARREST_REPORT" && !recordId) {
      await prisma.citizen.update({
        where: { id: citizen.id },
        data: { arrested: true },
      });
    }

    const validatedViolations = await Promise.all(
      data.violations.map((v) => validateRecordData({ ...v, ticketId: ticket.id, cad })),
    );

    const violations = await prisma.$transaction(
      validatedViolations.map((item) => {
        return prisma.violation.create({
          data: {
            fine: item.fine,
            bail: item.bail,
            jailTime: item.jailTime,
            penalCode: { connect: { id: item.penalCodeId } },
            records: { connect: { id: ticket.id } },
          },
          include: {
            penalCode: { include: { warningApplicable: true, warningNotApplicable: true } },
          },
        });
      }),
    );

    const seizedItems = await prisma.$transaction(
      (data.seizedItems ?? []).map((item) => {
        return prisma.seizedItem.create({
          data: {
            item: item.item,
            illegal: item.illegal ?? false,
            quantity: item.quantity ?? 1,
            recordId: ticket.id,
          },
        });
      }),
    );

    return { ...ticket, violations, seizedItems };
  }

  private async endInactiveWarrants(updatedAt: Date) {
    await prisma.warrant.updateMany({
      where: { updatedAt: { not: { gte: updatedAt } } },
      data: { status: "INACTIVE" },
    });
  }

  private async handleDiscordWebhook(
    ticket: ((Record & { violations: Violation[] }) | Warrant) & { citizen: Citizen },
    type: DiscordWebhookType = DiscordWebhookType.CITIZEN_RECORD,
  ) {
    try {
      const data = createWebhookData(ticket);
      await sendDiscordWebhook(type, data);
    } catch (error) {
      console.error("Could not send Discord webhook.", error);
    }
  }
}

async function unlinkViolations(violations: Pick<Violation, "id">[]) {
  await Promise.all(
    violations.map(async ({ id }) => {
      await prisma.violation.delete({ where: { id } });
    }),
  );
}

async function unlinkSeizedItems(items: Pick<SeizedItem, "id">[]) {
  await Promise.all(
    items.map(async ({ id }) => {
      await prisma.seizedItem.delete({ where: { id } });
    }),
  );
}

function createWebhookData(
  data: ((Record & { violations: Violation[] }) | Warrant) & { citizen: Citizen },
) {
  const isWarrant = !("notes" in data);
  const citizen = `${data.citizen.name} ${data.citizen.surname}`;
  const description = !isWarrant ? data.notes : "";

  const totalJailTime = getTotal("jailTime");
  const totalBail = getTotal("bail");
  const totalFines = getTotal("fine");

  const fields = [
    {
      name: "citizen",
      value: citizen,
      inline: true,
    },
  ];

  if (isWarrant) {
    fields.push({ name: "Status", value: data.status.toLowerCase(), inline: true });
  } else {
    fields.push(
      { name: "Postal", value: data.postal, inline: true },
      { name: "Record Type", value: data.type.toLowerCase(), inline: true },
      { name: "Total Bail", value: totalBail, inline: true },
      { name: "Total Fine amount", value: totalFines, inline: true },
      { name: "Total Jail Time", value: totalJailTime, inline: true },
    );
  }

  return {
    embeds: [
      {
        title: isWarrant ? "New warrant created" : "New record created",
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
      : null;

    return String(total);
  }
}
