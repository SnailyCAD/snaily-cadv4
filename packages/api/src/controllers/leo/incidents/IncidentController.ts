import { Controller, UseBefore, UseBeforeEach } from "@tsed/common";
import { Delete, Description, Get, Post, Put } from "@tsed/schema";
import { NotFound, InternalServerError } from "@tsed/exceptions";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/index";
import { leoProperties } from "lib/leo/activeOfficer";
import { LEO_INCIDENT_SCHEMA } from "@snailycad/schemas";
import { ActiveOfficer } from "middlewares/ActiveOfficer";
import type { Officer } from ".prisma/client";
import { validateSchema } from "lib/validateSchema";
import { Socket } from "services/SocketService";

@Controller("/incidents")
@UseBeforeEach(IsAuth)
export class IncidentController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/")
  @Description("Get all the created incidents")
  async getAllIncidents() {
    const incidents = await prisma.leoIncident.findMany({
      where: { NOT: { isActive: true } },
      include: {
        creator: { include: leoProperties },
        officersInvolved: { include: leoProperties },
        events: true,
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
    @Context("activeOfficer") officer: Officer | null,
  ) {
    const data = validateSchema(LEO_INCIDENT_SCHEMA, body);
    const officerId = officer?.id ?? null;

    const incident = await prisma.leoIncident.create({
      data: {
        creatorId: officerId,
        description: data.description,
        arrestsMade: data.arrestsMade,
        firearmsInvolved: data.firearmsInvolved,
        injuriesOrFatalities: data.injuriesOrFatalities,
        descriptionData: data.descriptionData,
        isActive: data.isActive ?? false,
      },
    });

    await Promise.all(
      (data.involvedOfficers ?? []).map(async (id: string) => {
        if (data.isActive) {
          await prisma.officer.update({
            where: { id },
            data: { activeIncidentId: incident.id },
          });
        }

        return prisma.leoIncident.update({
          where: {
            id: incident.id,
          },
          data: { officersInvolved: { connect: { id } } },
        });
      }),
    );

    const updated = await prisma.leoIncident.findUnique({
      where: { id: incident.id },
      include: {
        creator: { include: leoProperties },
        officersInvolved: { include: leoProperties },
      },
    });

    if (!updated) {
      throw new InternalServerError("Unable to find created incident");
    }

    if (updated.isActive) {
      this.socket.emitCreateActiveIncident(updated);
      this.socket.emitUpdateOfficerStatus();
    }

    return updated;
  }

  @UseBefore(ActiveOfficer)
  @Put("/:id")
  async updateIncident(@BodyParams() body: unknown, @PathParams("id") incidentId: string) {
    const data = validateSchema(LEO_INCIDENT_SCHEMA, body);

    const incident = await prisma.leoIncident.findUnique({
      where: { id: incidentId },
      include: { officersInvolved: true },
    });

    if (!incident) {
      throw new NotFound("notFound");
    }

    await Promise.all(
      incident.officersInvolved.map(async (officer) => {
        await prisma.officer.update({
          where: { id: officer.id },
          data: { activeIncidentId: null },
        });

        await prisma.leoIncident.update({
          where: { id: incidentId },
          data: {
            officersInvolved: { disconnect: { id: officer.id } },
          },
        });
      }),
    );

    await prisma.leoIncident.update({
      where: { id: incidentId },
      data: {
        description: data.description,
        arrestsMade: data.arrestsMade,
        firearmsInvolved: data.firearmsInvolved,
        injuriesOrFatalities: data.injuriesOrFatalities,
        descriptionData: data.descriptionData,
        isActive: data.isActive ?? false,
      },
    });

    await Promise.all(
      (data.involvedOfficers ?? []).map(async (id: string) => {
        if (data.isActive) {
          await prisma.officer.update({
            where: { id },
            data: { activeIncidentId: incident.id },
          });
        }

        return prisma.leoIncident.update({
          where: {
            id: incident.id,
          },
          data: { officersInvolved: { connect: { id } } },
        });
      }),
    );

    const updated = await prisma.leoIncident.findUnique({
      where: { id: incident.id },
      include: {
        creator: { include: leoProperties },
        officersInvolved: { include: leoProperties },
      },
    });

    if (!updated) {
      throw new InternalServerError("Unable to find created incident");
    }

    this.socket.emitUpdateActiveIncident(updated);
    this.socket.emitUpdateOfficerStatus();

    return updated;
  }

  @Delete("/:id")
  @Description("Delete an incident by its id")
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
