import { Controller, UseBefore, UseBeforeEach } from "@tsed/common";
import { Delete, Get, Post, Put } from "@tsed/schema";
import { NotFound } from "@tsed/exceptions";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/index";
import { leoProperties } from "lib/officer";
import { LEO_INCIDENT_SCHEMA } from "@snailycad/schemas";
import { ActiveOfficer } from "middlewares/ActiveOfficer";
import { Officer } from ".prisma/client";
import { validateSchema } from "lib/validateSchema";

@Controller("/incidents")
@UseBeforeEach(IsAuth)
export class IncidentController {
  @Get("/")
  async getAllIncidents() {
    const incidents = await prisma.leoIncident.findMany({
      include: {
        creator: { include: leoProperties },
        officersInvolved: { include: leoProperties },
      },
    });

    const officers = await prisma.officer.findMany({
      include: leoProperties,
    });

    return { incidents, officers };
  }

  @UseBefore(ActiveOfficer)
  @Post("/")
  async createIncident(
    @BodyParams() body: unknown,
    @Context("activeOfficer") { id: officerId }: Officer,
  ) {
    const data = validateSchema(LEO_INCIDENT_SCHEMA, body);

    const incident = await prisma.leoIncident.create({
      data: {
        creatorId: officerId,
        description: data.description,
        arrestsMade: data.arrestsMade,
        firearmsInvolved: data.firearmsInvolved,
        injuriesOrFatalities: data.injuriesOrFatalities,
      },
    });

    await Promise.all(
      (data.involvedOfficers ?? []).map(async (id: string) => {
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

  @UseBefore(ActiveOfficer)
  @Put("/:id")
  async updateIncident(@BodyParams() body: unknown, @PathParams("id") id: string) {
    const data = validateSchema(LEO_INCIDENT_SCHEMA, body);

    const incident = await prisma.leoIncident.findUnique({
      where: { id },
      include: { officersInvolved: true },
    });

    if (!incident) {
      throw new NotFound("notFound");
    }

    await Promise.all(
      incident.officersInvolved.map(async (officer) => {
        await prisma.leoIncident.update({
          where: { id },
          data: {
            officersInvolved: { disconnect: { id: officer.id } },
          },
        });
      }),
    );

    const updated = await prisma.leoIncident.update({
      where: { id },
      data: {
        description: data.description,
        arrestsMade: data.arrestsMade,
        firearmsInvolved: data.firearmsInvolved,
        injuriesOrFatalities: data.injuriesOrFatalities,
      },
    });

    const involvedOfficers = await Promise.all(
      (data.involvedOfficers ?? []).map(async (id: string) => {
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

    return { ...updated, officersInvolved: involvedOfficers };
  }

  @Delete("/:id")
  async deleteIncident(@PathParams("id") incidentId: string) {
    const incident = await prisma.leoIncident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new NotFound("incidentNotFound");
    }

    await prisma.leoIncident.delete({
      where: { id: incidentId },
    });

    return true;
  }
}
