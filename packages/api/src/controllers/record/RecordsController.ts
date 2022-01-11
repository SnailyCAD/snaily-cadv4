import { Delete, JsonRequestBody, Post, Put } from "@tsed/schema";
import { CREATE_TICKET_SCHEMA, CREATE_WARRANT_SCHEMA } from "@snailycad/schemas";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { UseBefore, UseBeforeEach } from "@tsed/platform-middlewares";
import { ActiveOfficer } from "middlewares/ActiveOfficer";
import { Controller } from "@tsed/di";
import { IsAuth } from "middlewares/index";
import { RecordType, Violation, WarrantStatus } from "@prisma/client";
import { validateSchema } from "lib/validateSchema";

@UseBeforeEach(IsAuth, ActiveOfficer)
@Controller("/records")
export class RecordsController {
  @Post("/create-warrant")
  async createWarrant(@BodyParams() body: JsonRequestBody, @Context() ctx: Context) {
    const data = validateSchema(CREATE_WARRANT_SCHEMA, body.toJSON());

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

  @Put("/:id")
  async updateWarrant(@BodyParams() body: JsonRequestBody, @PathParams("id") warrantId: string) {
    if (!body.get("status")) {
      throw new BadRequest("statusIsRequired");
    }

    const warrant = await prisma.warrant.findUnique({
      where: { id: warrantId },
    });

    if (!warrant) {
      throw new NotFound("warrantNotFound");
    }

    const updated = await prisma.warrant.update({
      where: { id: warrantId },
      data: {
        status: body.get("status"),
      },
    });

    return updated;
  }

  @Post("/")
  async createTicket(@BodyParams() body: JsonRequestBody, @Context() ctx: Context) {
    const data = validateSchema(CREATE_TICKET_SCHEMA, body.toJSON());

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
      body
        .get("violations")
        .map(
          async (item: {
            penalCodeId: string;
            fine: number | null;
            jailTime: number | null;
            bail: number | null;
          }) => {
            /** validate the penalCode data */
            const penalCode = await prisma.penalCode.findUnique({
              where: { id: item.penalCodeId },
              include: { warningApplicable: true, warningNotApplicable: true },
            });

            if (!penalCode) {
              return this.handleBadRequest(new NotFound("penalCodeNotFound"), ticket.id);
            }

            const [minFines, maxFines] =
              penalCode.warningApplicable?.fines ?? penalCode?.warningNotApplicable?.fines ?? [];
            const [minPrisonTerm, maxPrisonTerm] = penalCode.warningNotApplicable?.prisonTerm ?? [];
            const [minBail, maxBail] = penalCode.warningNotApplicable?.bail ?? [];

            // these if statements could be cleaned up?..
            if (
              item.fine &&
              this.exists(minFines, maxFines) &&
              !this.isCorrect(minFines!, maxFines!, item.fine)
            ) {
              return this.handleBadRequest(new BadRequest("fine_invalidDataReceived"), ticket.id);
            }

            if (
              item.jailTime &&
              this.exists(minPrisonTerm, maxPrisonTerm) &&
              !this.isCorrect(minPrisonTerm!, maxPrisonTerm!, item.jailTime)
            ) {
              return this.handleBadRequest(
                new BadRequest("jailTime_invalidDataReceived"),
                ticket.id,
              );
            }

            if (
              item.bail &&
              this.exists(minBail, maxBail) &&
              !this.isCorrect(minBail!, maxBail!, item.bail)
            ) {
              return this.handleBadRequest(new BadRequest("bail_invalidDataReceived"), ticket.id);
            }

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

  @UseBefore(ActiveOfficer)
  @Delete("/:id")
  async deleteRecord(@PathParams("id") id: string, @BodyParams() body: JsonRequestBody) {
    // eslint-disable-next-line @typescript-eslint/ban-types
    const type = body.get("type") as "WARRANT" | (string & {});

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

  isCorrect(min: number, max: number, value: number) {
    if (min < 0 || max < 0) {
      return false;
    }

    if (min === max) {
      return value === min;
    }

    return value >= min && value <= max;
  }

  exists(...values: (number | undefined)[]) {
    return values.every((v) => typeof v !== "undefined");
  }

  /**
   * remove the created ticket when there's an error with linking the penal codes.
   */
  async handleBadRequest(error: Error, recordId: string) {
    await prisma.record.delete({
      where: { id: recordId },
    });

    throw error;
  }
}
