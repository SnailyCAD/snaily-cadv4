import { Delete, Description, Post, Put } from "@tsed/schema";
import {
  CREATE_TICKET_SCHEMA,
  CREATE_WARRANT_SCHEMA,
  UPDATE_WARRANT_SCHEMA,
} from "@snailycad/schemas";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { NotFound } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { ActiveOfficer } from "middlewares/ActiveOfficer";
import { Controller } from "@tsed/di";
import { IsAuth } from "middlewares/IsAuth";
import {
  CadFeature,
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
} from "@prisma/client";
import { validateSchema } from "lib/validateSchema";
import { validateRecordData } from "lib/records/validateRecordData";
import { leoProperties } from "lib/leo/activeOfficer";
import { ExtendedNotFound } from "src/exceptions/ExtendedNotFound";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import { isFeatureEnabled } from "lib/cad";
import { sendDiscordWebhook } from "lib/discord/webhooks";
import { getFirstOfficerFromActiveOfficer } from "lib/leo/utils";

@UseBeforeEach(IsAuth, ActiveOfficer)
@Controller("/records")
export class RecordsController {
  @Post("/create-warrant")
  @Description("Create a new warrant")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async createWarrant(
    @BodyParams() body: unknown,
    @Context("activeOfficer") activeOfficer: (CombinedLeoUnit & { officers: Officer[] }) | Officer,
  ) {
    const data = validateSchema(CREATE_WARRANT_SCHEMA, body);
    const officer = getFirstOfficerFromActiveOfficer({ activeOfficer });

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: data.citizenId,
      },
    });

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    const warrant = await prisma.warrant.create({
      data: {
        citizenId: citizen.id,
        officerId: officer.id,
        description: data.description,
        status: data.status as WarrantStatus,
      },
      include: {
        citizen: true,
      },
    });

    await this.handleDiscordWebhook(warrant);

    await prisma.recordLog.create({
      data: {
        citizenId: citizen.id,
        warrantId: warrant.id,
      },
    });

    return warrant;
  }

  @Put("/warrant/:id")
  @Description("Update a warrant by its id")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async updateWarrant(@BodyParams() body: unknown, @PathParams("id") warrantId: string) {
    const data = validateSchema(UPDATE_WARRANT_SCHEMA, body);

    const warrant = await prisma.warrant.findUnique({
      where: { id: warrantId },
    });

    if (!warrant) {
      throw new NotFound("warrantNotFound");
    }

    const updated = await prisma.warrant.update({
      where: { id: warrantId },
      data: {
        status: data.status as WarrantStatus,
      },
    });

    return updated;
  }

  @Post("/")
  @Description("Create a new ticket, written warning or arrest report")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async createTicket(
    @BodyParams() body: unknown,
    @Context("cad") cad: { features?: CadFeature[] },
    @Context("activeOfficer") activeOfficer: (CombinedLeoUnit & { officers: Officer[] }) | Officer,
  ) {
    const data = validateSchema(CREATE_TICKET_SCHEMA, body);
    const officer = getFirstOfficerFromActiveOfficer({ activeOfficer });

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: data.citizenId,
      },
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

    const ticket = await prisma.record.create({
      data: {
        type: data.type as RecordType,
        citizenId: citizen.id,
        officerId: officer.id,
        notes: data.notes,
        postal: String(data.postal),
        status: recordStatus,
      },
      include: {
        officer: { include: leoProperties },
        citizen: true,
      },
    });

    if (ticket.type === "ARREST_REPORT") {
      await prisma.citizen.update({
        where: { id: citizen.id },
        data: { arrested: true },
      });
    }

    const violations: Violation[] = [];
    const seizedItems: SeizedItem[] = [];

    await Promise.all(
      data.violations.map(async (rawItem) => {
        const item = await validateRecordData({
          ...rawItem,
          ticketId: ticket.id,
          cad,
        });

        const violation = await prisma.violation.create({
          data: {
            fine: item.fine,
            bail: item.bail,
            jailTime: item.jailTime,
            penalCode: {
              connect: {
                id: item.penalCodeId,
              },
            },
            records: {
              connect: {
                id: ticket.id,
              },
            },
          },
          include: {
            penalCode: { include: { warningApplicable: true, warningNotApplicable: true } },
          },
        });

        violations.push(violation);
      }),
    );

    await Promise.all(
      (data.seizedItems ?? []).map(async (item) => {
        const seizedItem = await prisma.seizedItem.create({
          data: {
            item: item.item,
            illegal: item.illegal ?? false,
            quantity: item.quantity ?? 1,
            recordId: ticket.id,
          },
        });

        seizedItems.push(seizedItem);
      }),
    );

    await prisma.recordLog.create({
      data: {
        citizenId: citizen.id,
        recordId: ticket.id,
      },
    });

    await this.handleDiscordWebhook({ ...ticket, violations, seizedItems });

    return { ...ticket, violations, seizedItems };
  }

  @Put("/record/:id")
  @Description("Update a ticket, written warning or arrest report by its id")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async updateRecordById(
    @Context("cad") cad: { features?: CadFeature[] },
    @BodyParams() body: unknown,
    @PathParams("id") recordId: string,
  ) {
    const data = validateSchema(CREATE_TICKET_SCHEMA, body);

    const record = await prisma.record.findUnique({
      where: { id: recordId },
      include: { violations: true, seizedItems: true },
    });

    if (!record) {
      throw new NotFound("notFound");
    }

    const validatedViolations = await Promise.all(
      data.violations.map(async (v) => validateRecordData({ ...v, ticketId: record.id, cad })),
    );

    await unlinkViolations(record.violations);
    await unlinkSeizedItems(record.seizedItems);

    const updated = await prisma.record.update({
      where: { id: recordId },
      data: {
        notes: data.notes,
        postal: data.postal,
      },
      include: { officer: { include: leoProperties } },
    });

    const violations = await prisma.$transaction(
      validatedViolations.map((item) => {
        return prisma.violation.create({
          data: {
            fine: item.fine,
            bail: item.bail,
            jailTime: item.jailTime,
            penalCode: {
              connect: {
                id: item.penalCodeId,
              },
            },
            records: { connect: { id: updated.id } },
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
            recordId: updated.id,
          },
        });
      }),
    );

    return { ...updated, violations, seizedItems };
  }

  @Delete("/:id")
  @Description("Delete a ticket, written warning or arrest report by its id")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async deleteRecord(
    @PathParams("id") id: string,
    @BodyParams("type") type: "WARRANT" | (string & {}),
  ) {
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

  private async handleDiscordWebhook(ticket: any) {
    try {
      const data = createWebhookData(ticket);
      await sendDiscordWebhook(DiscordWebhookType.CITIZEN_RECORD, data);
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
  data: ((Record & { violations: Violation[] }) | Warrant) & { citizen: Citizen; officer: any },
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
    const total = !isWarrant ? data.violations.reduce((ac, cv) => ac + (cv[name] || 0), 0) : null;
    return String(total);
  }
}
