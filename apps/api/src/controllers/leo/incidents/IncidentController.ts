import { Controller, UseBefore, UseBeforeEach } from "@tsed/common";
import { ContentType, Delete, Description, Get, Post, Put } from "@tsed/schema";
import { NotFound, InternalServerError, BadRequest } from "@tsed/exceptions";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { leoProperties, unitProperties, _leoProperties } from "lib/leo/activeOfficer";
import { LEO_INCIDENT_SCHEMA } from "@snailycad/schemas";
import { ActiveOfficer } from "middlewares/ActiveOfficer";
import { Officer, ShouldDoType, MiscCadSettings, CombinedLeoUnit } from "@prisma/client";
import { validateSchema } from "lib/validateSchema";
import { Socket } from "services/SocketService";
import type { z } from "zod";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import { officerOrDeputyToUnit } from "lib/leo/officerOrDeputyToUnit";
import { findUnit } from "lib/leo/findUnit";
import { getFirstOfficerFromActiveOfficer, getPrismaNameActiveCallIncident } from "lib/leo/utils";
import type * as APITypes from "@snailycad/types/api";

export const assignedUnitsInclude = {
  include: {
    officer: { include: _leoProperties },
    deputy: { include: unitProperties },
    combinedUnit: {
      include: {
        status: { include: { value: true } },
        department: { include: { value: true } },
        officers: {
          include: _leoProperties,
        },
      },
    },
  },
};

export const incidentInclude = {
  creator: { include: leoProperties },
  events: true,
  situationCode: { include: { value: true } },
  unitsInvolved: assignedUnitsInclude,
};

@Controller("/incidents")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
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
  async getAllIncidents(): Promise<APITypes.GetIncidentsData> {
    const incidents = await prisma.leoIncident.findMany({
      where: { NOT: { isActive: true } },
      include: incidentInclude,
      orderBy: { caseNumber: "desc" },
    });

    return { incidents: incidents.map(officerOrDeputyToUnit) };
  }

  @Get("/:id")
  @Description("Get an incident by its id")
  @UsePermissions({
    permissions: [Permissions.Dispatch, Permissions.ViewIncidents, Permissions.ManageIncidents],
    fallback: (u) => u.isDispatch || u.isLeo,
  })
  async getIncidentById(@PathParams("id") id: string): Promise<APITypes.GetIncidentByIdData> {
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
  ): Promise<APITypes.PostIncidentsData> {
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
    @PathParams("type") assignType: "assign" | "unassign",
    @PathParams("incidentId") incidentId: string,
    @BodyParams("unit") rawUnitId: string | null,
  ): Promise<APITypes.PutAssignUnassignIncidentsData> {
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

    if (assignType === "assign") {
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

    const prismaNames = {
      leo: "officer",
      "ems-fd": "emsFdDeputy",
      combined: "combinedLeoUnit",
    } as const;
    const prismaName = prismaNames[type];

    // @ts-expect-error method has same properties
    await prisma[prismaName].update({
      where: { id: unit.id },
      data: { activeIncidentId: assignType === "assign" ? incidentId : null },
    });

    await Promise.all([
      this.socket.emitUpdateOfficerStatus(),
      this.socket.emitUpdateDeputyStatus(),
    ]);

    const updated = await prisma.leoIncident.findUniqueOrThrow({
      where: {
        id: incident.id,
      },
      include: incidentInclude,
    });

    const normalizedIncident = officerOrDeputyToUnit(updated);
    this.socket.emitUpdate911Call(normalizedIncident);

    return normalizedIncident;
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
  ): Promise<APITypes.PutIncidentByIdData> {
    const data = validateSchema(LEO_INCIDENT_SCHEMA, body);
    const maxAssignmentsToIncidents = cad.miscCadSettings.maxAssignmentsToIncidents ?? Infinity;

    const incident = await prisma.leoIncident.findUnique({
      where: { id: incidentId },
      include: { unitsInvolved: true },
    });

    if (!incident) {
      throw new NotFound("notFound");
    }

    await Promise.all([
      ...incident.unitsInvolved.map(({ id }) =>
        prisma.incidentInvolvedUnit.delete({ where: { id } }),
      ),
      ...incident.unitsInvolved.map(async (unit) => {
        const { prismaName, unitId } = getPrismaNameActiveCallIncident({ unit });

        if (!prismaName) return;

        // @ts-expect-error method has the same properties
        await prisma[prismaName].update({
          where: { id: unitId },
          data: { activeIncidentId: null },
        });
      }),
    ]);

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

    await this.connectUnitsInvolved(incident.id, data, maxAssignmentsToIncidents);

    const updated = await prisma.leoIncident.findUniqueOrThrow({
      where: { id: incident.id },
      include: incidentInclude,
    });

    const normalizedIncident = officerOrDeputyToUnit(updated);

    this.socket.emitUpdateActiveIncident(normalizedIncident);
    await this.socket.emitUpdateOfficerStatus();
    await this.socket.emitUpdateDeputyStatus();

    return normalizedIncident;
  }

  @Delete("/:id")
  @Description("Delete an incident by its id")
  @UsePermissions({
    permissions: [Permissions.Dispatch, Permissions.ManageIncidents],
    fallback: (u) => u.isSupervisor,
  })
  async deleteIncident(
    @PathParams("id") incidentId: string,
  ): Promise<APITypes.DeleteIncidentByIdData> {
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
    if (!data.unitsInvolved) return;

    for (const unitId of data.unitsInvolved) {
      if (typeof unitId !== "string") continue;

      const { unit, type } = await findUnit(unitId, {
        NOT: { status: { shouldDo: ShouldDoType.SET_OFF_DUTY } },
      });

      if (!unit) {
        continue;
      }

      const types = {
        combined: "combinedLeoId",
        leo: "officerId",
        "ems-fd": "emsFdDeputyId",
      } as const;

      const assignmentCount = await prisma.incidentInvolvedUnit.count({
        where: {
          [types[type]]: unit.id,
          incident: { isActive: true },
        },
      });

      if (assignmentCount >= maxAssignmentsToIncidents) {
        // skip this officer
        continue;
      }

      const existing = await prisma.incidentInvolvedUnit.count({
        where: {
          [types[type]]: unit.id,
          incidentId,
        },
      });

      if (existing >= 1) {
        continue;
      }

      const involvedUnit = await prisma.incidentInvolvedUnit.create({
        data: {
          incidentId,
          [types[type]]: unit.id,
        },
      });

      const prismaName =
        type === "combined"
          ? "combinedLeoUnit"
          : (types[type].replace("Id", "") as "officer" | "emsFdDeputy");

      // @ts-expect-error method has the same properties
      await prisma[prismaName].update({
        where: { id: unit.id },
        data: { activeIncidentId: incidentId },
      });

      await prisma.leoIncident.update({
        where: { id: incidentId },
        data: {
          unitsInvolved: { connect: { id: involvedUnit.id } },
        },
      });
    }
  }
}
