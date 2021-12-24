import { Delete, JsonRequestBody, Post } from "@tsed/schema";
import { CREATE_TICKET_SCHEMA, CREATE_WARRANT_SCHEMA, validate } from "@snailycad/schemas";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { UseBefore, UseBeforeEach } from "@tsed/platform-middlewares";
import { ActiveOfficer } from "middlewares/ActiveOfficer";
import { Controller } from "@tsed/di";
import { IsAuth } from "middlewares/index";
import { Violation } from "@prisma/client";

@UseBeforeEach(IsAuth, ActiveOfficer)
@Controller("/records")
export class RecordsController {
  @Post("/create-warrant")
  async createWarrant(@BodyParams() body: JsonRequestBody, @Context() ctx: Context) {
    const error = validate(CREATE_WARRANT_SCHEMA, body.toJSON(), true);
    if (error) {
      throw new BadRequest(error);
    }

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: body.get("citizenId"),
      },
    });

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    const warrant = await prisma.warrant.create({
      data: {
        citizenId: citizen.id,
        officerId: ctx.get("activeOfficer").id,
        description: body.get("description"),
        status: body.get("status"),
      },
    });

    return warrant;
  }

  @Post("/")
  async createTicket(@BodyParams() body: JsonRequestBody, @Context() ctx: Context) {
    const error = validate(CREATE_TICKET_SCHEMA, body.toJSON(), true);
    if (error) {
      throw new BadRequest(error);
    }

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: body.get("citizenId"),
      },
    });

    if (!citizen || `${citizen.name} ${citizen.surname}` !== body.get("citizenName")) {
      throw new NotFound("citizenNotFound");
    }

    const ticket = await prisma.record.create({
      data: {
        type: body.get("type"),
        citizenId: citizen.id,
        officerId: ctx.get("activeOfficer").id,
        notes: body.get("notes"),
        postal: body.get("postal"),
      },
      include: {
        violations: true,
      },
    });

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

    return { ...ticket, violations };
  }

  @UseBefore(ActiveOfficer)
  @Delete("/:id")
  async deleteRecord(@PathParams("id") id: string) {
    const record = await prisma.record.findUnique({
      where: { id },
    });

    if (!record) {
      throw new NotFound("recordNotFound");
    }

    await prisma.record.delete({
      where: { id },
    });

    return true;
  }
}
