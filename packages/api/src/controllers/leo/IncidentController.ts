import { Controller, UseBefore, UseBeforeEach } from "@tsed/common";
import { Get, JsonRequestBody, Post } from "@tsed/schema";
import { BadRequest } from "@tsed/exceptions";
import { BodyParams, Context } from "@tsed/platform-params";
import { prisma } from "../../lib/prisma";
import { IsAuth } from "../../middlewares";
import { unitProperties } from "../../lib/officer";
import { LEO_INCIDENT_SCHEMA, validate } from "@snailycad/schemas";
import { ActiveOfficer } from "../../middlewares/ActiveOfficer";
import { Officer } from ".prisma/client";

@Controller("/incidents")
@UseBeforeEach(IsAuth)
export class IncidentController {
  @Get("/")
  async getAllIncidents() {
    const incidents = await prisma.leoIncident.findMany({
      include: {
        creator: { include: unitProperties },
        officersInvolved: { include: unitProperties },
      },
    });

    return incidents;
  }

  @UseBefore(ActiveOfficer)
  @Post("/")
  async searchWeapon(
    @BodyParams() body: JsonRequestBody,
    @Context("activeOfficer") { id: officerId }: Officer,
  ) {
    const error = validate(LEO_INCIDENT_SCHEMA, body.toJSON(), true);

    if (error) {
      throw new BadRequest(error);
    }

    const incident = await prisma.leoIncident.create({
      data: {
        creatorId: officerId,
        description: body.get("description"),
        arrestsMade: body.get("arrestsMade"),
        firearmsInvolved: body.get("firearmsInvolved"),
        injuriesOrFatalities: body.get("injuriesOrFatalities"),
      },
    });

    await Promise.all(
      body.get("officersInvolved").map(async (id: string) => {
        await prisma.leoIncident.update({
          where: {
            id: incident.id,
          },
          data: {
            officersInvolved: {
              connect: {
                id,
              },
            },
          },
        });
      }),
    );

    return incident;
  }
}
