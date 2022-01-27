import { Delete, Post, Put } from "@tsed/schema";
import {
  CREATE_TICKET_SCHEMA,
  CREATE_WARRANT_SCHEMA,
  UPDATE_WARRANT_SCHEMA,
} from "@snailycad/schemas";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { NotFound } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { UseBefore, UseBeforeEach } from "@tsed/platform-middlewares";
import { ActiveOfficer } from "middlewares/ActiveOfficer";
import { Controller } from "@tsed/di";
import { IsAuth } from "middlewares/index";
import type { RecordType, Violation, WarrantStatus } from "@prisma/client";
import { validateSchema } from "lib/validateSchema";
import { validateRecordData } from "lib/records/validateRecordData";

@UseBeforeEach(IsAuth, ActiveOfficer)
@Controller("/records")
export class RecordsController {
  @Post("/create-warrant")
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

    await prisma.recordLog.create({
      data: {
        citizenId: citizen.id,
        recordId: ticket.id,
      },
    });

    return { ...ticket, violations };
  }

  @Put("/record/:id")
  async updateRecordById(
    @BodyParams() body: unknown,
    @PathParams("id") recordId: string,
    // @Context() ctx: Context,
  ) {
    const data = validateSchema(CREATE_TICKET_SCHEMA, body);

    const record = await prisma.record.findUnique({
      where: { id: recordId },
    });

    if (!record) {
      throw new NotFound("notFound");
    }

    const updated = await prisma.record.update({
      where: { id: recordId },
      data: {
        notes: data.notes,
        postal: data.postal,
      },
      include: {
        violations: true,
      },
    });

    const violations = updated.violations;

    // todo: this doesn't work when new penal-codes are added/deleted *yet*
    await Promise.all(
      violations.map(async (violation, idx) => {
        const dataViolation = data.violations.find((v) => v.id === violation.id);

        if (dataViolation) {
          const updatedViolation = await prisma.violation.update({
            where: { id: violation.id },
            data: {
              fine: dataViolation.fine,
              bail: dataViolation.bail,
              jailTime: dataViolation.jailTime,
              penalCode: {
                connect: {
                  id: dataViolation.penalCodeId,
                },
              },
            },
          });

          violations[idx] = updatedViolation;
        }
      }),
    );

    return { ...updated, violations };
  }

  @UseBefore(ActiveOfficer)
  @Delete("/:id")
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
