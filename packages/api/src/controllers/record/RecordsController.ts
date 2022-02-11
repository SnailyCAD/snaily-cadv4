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
import { IsAuth } from "middlewares/index";
import type { RecordType, SeizedItem, Violation, WarrantStatus } from "@prisma/client";
import { validateSchema } from "lib/validateSchema";
import { validateRecordData } from "lib/records/validateRecordData";
import { leoProperties } from "lib/officer";

@UseBeforeEach(IsAuth, ActiveOfficer)
@Controller("/records")
export class RecordsController {
  @Post("/create-warrant")
  @Description("Create a new warrant")
  async createWarrant(@BodyParams() body: unknown, @Context() ctx: Context) {
    const data = validateSchema(CREATE_WARRANT_SCHEMA, body);

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
        officerId: ctx.get("activeOfficer").id,
        description: data.description,
        status: data.status as WarrantStatus,
      },
    });

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
  async createTicket(@BodyParams() body: unknown, @Context() ctx: Context) {
    const data = validateSchema(CREATE_TICKET_SCHEMA, body);

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: data.citizenId,
      },
    });

    if (!citizen || `${citizen.name} ${citizen.surname}` !== data.citizenName) {
      throw new NotFound("citizenNotFound");
    }

    const ticket = await prisma.record.create({
      data: {
        type: data.type as RecordType,
        citizenId: citizen.id,
        officerId: ctx.get("activeOfficer").id,
        notes: data.notes,
        postal: String(data.postal),
      },
      include: {
        violations: true,
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
      data.violations.map(
        async (rawItem: {
          penalCodeId: string;
          fine: number | null;
          jailTime: number | null;
          bail: number | null;
        }) => {
          const item = await validateRecordData({
            ...rawItem,
            ticketId: ticket.id,
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
          });

          violations.push(violation);
        },
      ),
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

    return { ...ticket, violations, seizedItems };
  }

  @Put("/record/:id")
  @Description("Update a ticket, written warning or arrest report by its id")
  async updateRecordById(@BodyParams() body: unknown, @PathParams("id") recordId: string) {
    const data = validateSchema(CREATE_TICKET_SCHEMA, body);

    const record = await prisma.record.findUnique({
      where: { id: recordId },
      include: { violations: true, seizedItems: true },
    });

    if (!record) {
      throw new NotFound("notFound");
    }

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

    const violations: Violation[] = [];
    const seizedItems: SeizedItem[] = [];

    const validatedViolations = await Promise.all(
      data.violations.map(async (v) => validateRecordData(v)),
    );

    await Promise.all(
      validatedViolations.map(async (item) => {
        const created = await prisma.violation.create({
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
          include: { penalCode: true },
        });

        violations.push(created);
      }),
    );

    await Promise.all(
      (data.seizedItems ?? []).map(async (item) => {
        const seizedItem = await prisma.seizedItem.create({
          data: {
            item: item.item,
            illegal: item.illegal ?? false,
            quantity: item.quantity ?? 1,
            recordId: updated.id,
          },
        });

        seizedItems.push(seizedItem);
      }),
    );

    return { ...updated, violations, seizedItems };
  }

  @Delete("/:id")
  @Description("Delete a ticket, written warning or arrest report by its id")
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
