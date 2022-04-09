import { Controller, UseBefore, UseBeforeEach } from "@tsed/common";
import { Delete, Description, Get, Post, Put } from "@tsed/schema";
import { NotFound, InternalServerError, BadRequest } from "@tsed/exceptions";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { leoProperties } from "lib/leo/activeOfficer";
import { LEO_INCIDENT_SCHEMA } from "@snailycad/schemas";
import { ActiveOfficer } from "middlewares/ActiveOfficer";
import { Officer, ShouldDoType } from "@prisma/client";
import { validateSchema } from "lib/validateSchema";
import { Socket } from "services/SocketService";
import type { z } from "zod";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import type { MiscCadSettings } from "@snailycad/types";
import { assignedUnitsInclude, findUnit } from "controllers/dispatch/911-calls/Calls911Controller";
import { officerOrDeputyToUnit } from "lib/leo/officerOrDeputyToUnit";

export const incidentInclude = {
  creator: { include: leoProperties },
  officersInvolved: { include: leoProperties },
  events: true,
  situationCode: { include: { value: true } },
  unitsInvolved: assignedUnitsInclude,
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

    const correctedIncidents = incidents.map(officerOrDeputyToUnit);

    return { incidents: correctedIncidents, officers };
  }

  @Get("/:id")
  @Description("Get an incident by its id")
  @UsePermissions({
    permissions: [Permissions.ViewIncidents, Permissions.ManageIncidents],
    fallback: (u) => u.isDispatch || u.isLeo,
  })
  async getIncidentById(@PathParams("id") id: string) {
    const incident = await prisma.leoIncident.findUnique({
      where: { id },
      include: incidentInclude,
    });

    return officerOrDeputyToUnit(incident);
  }

  @UseBefore(ActiveOfficer)
  @Post("/")
  @UsePermissions({
    permissions: [Permissions.ManageIncidents],
    fallback: (u) => u.isDispatch || u.isLeo,
  })
  async createIncident(
    @BodyParams() body: unknown,
    @Context("cad") cad: { miscCadSettings: MiscCadSettings },
    @Context("activeOfficer") officer: Officer | null,
  ) {
    const data = validateSchema(LEO_INCIDENT_SCHEMA, body);
    const officerId = officer?.id ?? null;
    const maxAssignmentsToIncidents = cad.miscCadSettings.maxAssignmentsToIncidents ?? Infinity;

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
        postal: data.postal ?? null,
      },
    });

    await this.connectOfficersInvolved(incident.id, data, maxAssignmentsToIncidents);

    const updated = await prisma.leoIncident.findUnique({
      where: { id: incident.id },
      include: incidentInclude,
    });

    if (!updated) {
      throw new InternalServerError("Unable to find created incident");
    }

    const corrected = officerOrDeputyToUnit(updated);

    if (updated.isActive) {
      this.socket.emitCreateActiveIncident(corrected);
      this.socket.emitUpdateOfficerStatus();
    }

    return corrected;
  }

  @UseBefore(ActiveOfficer)
  @Put("/:id")
  @UsePermissions({
    permissions: [Permissions.ManageIncidents],
    fallback: (u) => u.isDispatch || u.isLeo,
  })
  async updateIncident(
    @BodyParams() body: unknown,
    @Context("cad") cad: { miscCadSettings: MiscCadSettings },
    @PathParams("id") incidentId: string,
  ) {
    const data = validateSchema(LEO_INCIDENT_SCHEMA, body);
    const maxAssignmentsToIncidents = cad.miscCadSettings.maxAssignmentsToIncidents ?? Infinity;

    const incident = await prisma.leoIncident.findUnique({
      where: { id: incidentId },
      include: { unitsInvolved: true },
    });

    if (!incident) {
      throw new NotFound("notFound");
    }

    await prisma.$transaction(
      incident.unitsInvolved.map(({ id }) => prisma.incidentInvolvedUnit.delete({ where: { id } })),
    );

    await Promise.all(
      incident.unitsInvolved.map(async (unit) => {
        if (unit.officerId) {
          await prisma.officer.update({
            where: { id: unit.officerId },
            data: { activeIncidentId: null },
          });
        }
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
        postal: data.postal ?? null,
        situationCodeId: data.situationCodeId ?? null,
      },
    });

    await this.connectOfficersInvolved(incident.id, data, maxAssignmentsToIncidents);

    const updated = await prisma.leoIncident.findUnique({
      where: { id: incident.id },
      include: incidentInclude,
    });

    if (!updated) {
      throw new InternalServerError("Unable to find created incident");
    }

    const corrected = officerOrDeputyToUnit(updated);

    this.socket.emitUpdateActiveIncident(corrected);
    this.socket.emitUpdateOfficerStatus();

    return corrected;
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
    data: Pick<z.infer<typeof LEO_INCIDENT_SCHEMA>, "unitsInvolved" | "isActive">,
    maxAssignmentsToIncidents: number,
  ) {
    await Promise.all(
      (data.unitsInvolved ?? []).map(async (id: string) => {
        const { unit, type } = await findUnit(
          id,
          {
            NOT: { status: { shouldDo: ShouldDoType.SET_OFF_DUTY } },
          },
          true,
        );

        if (!unit) {
          throw new BadRequest("unitOffDuty");
        }

        const types = {
          combined: "combinedLeoId",
          leo: "officerId",
          "ems-fd": "emsFdDeputyId",
        };

        const assignmentCount = await prisma.incidentInvolvedUnit.count({
          where: {
            [types[type]]: unit.id,
            incident: { isActive: true },
          },
        });

        if (assignmentCount >= maxAssignmentsToIncidents) {
          // skip this officer
          return;
        }

        const existing = await prisma.incidentInvolvedUnit.count({
          where: {
            [types[type]]: unit.id,
            incidentId,
          },
        });

        if (existing >= 1) {
          return;
        }

        const involvedUnit = await prisma.incidentInvolvedUnit.create({
          data: {
            incidentId,
            [types[type]]: unit.id,
          },
        });

        if (type === "leo") {
          await prisma.officer.update({
            where: { id: unit.id },
            data: { activeIncidentId: incidentId },
          });
        }

        await prisma.leoIncident.update({
          where: { id: incidentId },
          data: {
            unitsInvolved: { connect: { id: involvedUnit.id } },
          },
        });
      }),
    );
  }
}
