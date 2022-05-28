import { Controller, UseBefore, UseBeforeEach } from "@tsed/common";
import { Delete, Description, Get, Post, Put } from "@tsed/schema";
import { NotFound, InternalServerError, BadRequest } from "@tsed/exceptions";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { leoProperties } from "lib/leo/activeOfficer";
import { LEO_INCIDENT_SCHEMA } from "@snailycad/schemas";
import { ActiveOfficer } from "middlewares/ActiveOfficer";
import { Officer, ShouldDoType, MiscCadSettings, CombinedLeoUnit } from "@prisma/client";
import { validateSchema } from "lib/validateSchema";
import { Socket } from "services/SocketService";
import type { z } from "zod";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import { assignedUnitsInclude } from "controllers/dispatch/911-calls/Calls911Controller";
import { officerOrDeputyToUnit } from "lib/leo/officerOrDeputyToUnit";
import { findUnit } from "lib/leo/findUnit";
import { getFirstOfficerFromActiveOfficer } from "lib/leo/utils";

export const incidentInclude = {
  creator: { include: leoProperties },
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
    permissions: [Permissions.Dispatch, Permissions.ViewIncidents, Permissions.ManageIncidents],
    fallback: (u) => u.isDispatch || u.isLeo,
  })
  async getAllIncidents() {
    const incidents = await prisma.leoIncident.findMany({
      where: { NOT: { isActive: true } },
      include: incidentInclude,
    });

    return { incidents: incidents.map(officerOrDeputyToUnit) };
  }

  @Get("/:id")
  @Description("Get an incident by its id")
  @UsePermissions({
    permissions: [Permissions.Dispatch, Permissions.ViewIncidents, Permissions.ManageIncidents],
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
    permissions: [Permissions.Dispatch, Permissions.ManageIncidents],
    fallback: (u) => u.isDispatch || u.isLeo,
  })
  async createIncident(
    @BodyParams() body: unknown,
    @Context("cad") cad: { miscCadSettings: MiscCadSettings },
    @Context("activeOfficer") activeOfficer: (CombinedLeoUnit & { officers: Officer[] }) | Officer,
  ) {
    const data = validateSchema(LEO_INCIDENT_SCHEMA, body);
    const officer = getFirstOfficerFromActiveOfficer({ allowDispatch: true, activeOfficer });
    const maxAssignmentsToIncidents = cad.miscCadSettings.maxAssignmentsToIncidents ?? Infinity;

    const incident = await prisma.leoIncident.create({
      data: {
        creatorId: officer?.id ?? null,
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

    await this.connectUnitsInvolved(incident.id, data, maxAssignmentsToIncidents);

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
      await this.socket.emitUpdateOfficerStatus();
    }

    return corrected;
  }

  @Post("/:type/:incidentId")
  @UsePermissions({
    fallback: (u) => u.isDispatch || u.isLeo || u.isEmsFd,
    permissions: [Permissions.Dispatch, Permissions.Leo, Permissions.EmsFd],
  })
  async assignToIncident(
    @PathParams("type") callType: "assign" | "unassign",
    @PathParams("incidentId") incidentId: string,
    @BodyParams("unit") rawUnitId: string | null,
  ) {
    if (!rawUnitId) {
      throw new BadRequest("unitIsRequired");
    }

    const { unit, type } = await findUnit(rawUnitId);
    if (!unit) {
      throw new NotFound("unitNotFound");
    }

    const incident = await prisma.leoIncident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new NotFound("incidentNotFound");
    }

    const types = {
      combined: "combinedLeoId",
      leo: "officerId",
      "ems-fd": "emsFdDeputyId",
    };

    const existing = await prisma.incidentInvolvedUnit.findFirst({
      where: {
        incidentId,
        [types[type]]: unit.id,
      },
    });

    if (callType === "assign") {
      if (existing) {
        throw new BadRequest("alreadyAssignedToCall");
      }

      await prisma.incidentInvolvedUnit.create({
        data: {
          incidentId,
          [types[type]]: unit.id,
        },
      });
    } else {
      if (!existing) {
        throw new BadRequest("notAssignedToCall");
      }

      await prisma.incidentInvolvedUnit.delete({
        where: { id: existing.id },
      });
    }

    if (type === "leo") {
      await prisma.officer.update({
        where: { id: unit.id },
        data: { activeIncidentId: callType === "assign" ? incidentId : null },
      });

      await Promise.all([
        this.socket.emitUpdateOfficerStatus(),
        this.socket.emitUpdateDeputyStatus(),
      ]);
    }

    const updated = await prisma.leoIncident.findUnique({
      where: {
        id: incident.id,
      },
      include: incidentInclude,
    });

    this.socket.emitUpdate911Call(officerOrDeputyToUnit(updated));

    return officerOrDeputyToUnit(updated);
  }

  @UseBefore(ActiveOfficer)
  @Put("/:id")
  @UsePermissions({
    permissions: [Permissions.Dispatch, Permissions.ManageIncidents],
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

    if (data.isActive) {
      await prisma.$transaction(
        incident.unitsInvolved.map(({ id }) =>
          prisma.incidentInvolvedUnit.delete({ where: { id } }),
        ),
      );
    }

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

    if (data.isActive) {
      await this.connectUnitsInvolved(incident.id, data, maxAssignmentsToIncidents);
    }

    const updated = await prisma.leoIncident.findUnique({
      where: { id: incident.id },
      include: incidentInclude,
    });

    if (!updated) {
      throw new InternalServerError("Unable to find created incident");
    }

    const corrected = officerOrDeputyToUnit(updated);

    this.socket.emitUpdateActiveIncident(corrected);
    await this.socket.emitUpdateOfficerStatus();

    return corrected;
  }

  @Delete("/:id")
  @Description("Delete an incident by its id")
  @UsePermissions({
    permissions: [Permissions.Dispatch, Permissions.ManageIncidents],
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

  private async connectUnitsInvolved(
    incidentId: string,
    data: Pick<z.infer<typeof LEO_INCIDENT_SCHEMA>, "unitsInvolved" | "isActive">,
    maxAssignmentsToIncidents: number,
  ) {
    await Promise.all(
      (data.unitsInvolved ?? []).map(async (id: string) => {
        const { unit, type } = await findUnit(id, {
          NOT: { status: { shouldDo: ShouldDoType.SET_OFF_DUTY } },
        });

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
