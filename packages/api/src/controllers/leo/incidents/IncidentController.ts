import { Controller, UseBefore, UseBeforeEach } from "@tsed/common";
import { Delete, Description, Get, Post, Put } from "@tsed/schema";
import { NotFound, InternalServerError } from "@tsed/exceptions";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { leoProperties } from "lib/leo/activeOfficer";
import { LEO_INCIDENT_SCHEMA } from "@snailycad/schemas";
import { ActiveOfficer } from "middlewares/ActiveOfficer";
import type { Officer } from "@prisma/client";
import { validateSchema } from "lib/validateSchema";
import { Socket } from "services/SocketService";
import type { z } from "zod";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";

export const incidentInclude = {
  creator: { include: leoProperties },
  officersInvolved: { include: leoProperties },
  events: true,
  situationCode: { include: { value: true } },
};

@Controller("/incidents")
@UseBeforeEach(IsAuth)
export class IncidentController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/")
  @Description("Get all the created incidents")
  @UsePermissions({
    permissions: [Permissions.ViewIncidents, Permissions.ManageIncidents],
    fallback: (u) => u.isDispatch || u.isLeo,
  })
  async getAllIncidents() {
    const incidents = await prisma.leoIncident.findMany({
      where: { NOT: { isActive: true } },
      include: incidentInclude,
    });

    const officers = await prisma.officer.findMany({
      include: leoProperties,
    });

    return { incidents, officers };
  }

  @UseBefore(ActiveOfficer)
  @Post("/")
  @UsePermissions({
    permissions: [Permissions.ManageIncidents],
    fallback: (u) => u.isDispatch || u.isLeo,
  })
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
        situationCodeId: data.situationCodeId ?? null,
      },
    });

    await this.connectOfficersInvolved(incident.id, data);

    const updated = await prisma.leoIncident.findUnique({
      where: { id: incident.id },
      include: incidentInclude,
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
  @UsePermissions({
    permissions: [Permissions.ManageIncidents],
    fallback: (u) => u.isDispatch || u.isLeo,
  })
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
        situationCodeId: data.situationCodeId ?? null,
      },
    });

    await this.connectOfficersInvolved(incident.id, data);

    const updated = await prisma.leoIncident.findUnique({
      where: { id: incident.id },
      include: incidentInclude,
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
  @UsePermissions({
    permissions: [Permissions.ManageIncidents],
    fallback: (u) => u.isSupervisor,
  })
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

  protected async connectOfficersInvolved(
    incidentId: string,
    data: Pick<z.infer<typeof LEO_INCIDENT_SCHEMA>, "involvedOfficers" | "isActive">,
  ) {
    await prisma.$transaction(
      (data.involvedOfficers ?? []).map((id: string) => {
        return prisma.leoIncident.update({
          where: { id: incidentId },
          data: {
            officersInvolved: {
              connect: { id },
              update: data.isActive
                ? {
                    where: { id },
                    data: { activeIncidentId: incidentId },
                  }
                : undefined,
            },
          },
        });
      }),
    );
  }
}
