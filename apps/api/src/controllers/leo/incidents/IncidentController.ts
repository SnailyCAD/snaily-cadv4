import { Controller, UseBefore, UseBeforeEach } from "@tsed/common";
import { ContentType, Delete, Description, Get, Post, Put } from "@tsed/schema";
import { NotFound, InternalServerError, BadRequest } from "@tsed/exceptions";
import { QueryParams, BodyParams, Context, PathParams } from "@tsed/platform-params";
import { prisma } from "lib/data/prisma";
import { IsAuth } from "middlewares/is-auth";
import { leoProperties, unitProperties, _leoProperties } from "lib/leo/activeOfficer";
import { LEO_INCIDENT_SCHEMA } from "@snailycad/schemas";
import { ActiveOfficer } from "middlewares/active-officer";
import type { Officer, MiscCadSettings, CombinedLeoUnit } from "@prisma/client";
import { validateSchema } from "lib/data/validate-schema";
import { Socket } from "services/socket-service";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import { officerOrDeputyToUnit } from "lib/leo/officerOrDeputyToUnit";
import { findUnit } from "lib/leo/findUnit";
import { getFirstOfficerFromActiveOfficer, getInactivityFilter } from "lib/leo/utils";
import type * as APITypes from "@snailycad/types/api";
import { getNextIncidentId } from "lib/incidents/get-next-incident-id";
import { assignUnitsInvolvedToIncident } from "lib/incidents/handle-involved-units";
import { cad } from "@snailycad/types";

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
    combinedEmsFdUnit: {
      include: {
        status: { include: { value: true } },
        department: { include: { value: true } },
        deputies: {
          include: unitProperties,
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

type ActiveTypes = "active" | "inactive" | "all";

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
  async getAllIncidents(
    @Context("cad") cad: cad,
    @QueryParams("activeType", String) activeType: ActiveTypes = "inactive",
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("includeAll", Boolean) includeAll = false,
    @QueryParams("assignedUnit", String) assignedUnit?: string,
  ): Promise<APITypes.GetIncidentsData<"leo">> {
    const incidentInactivityFilter = getInactivityFilter(cad, "incidentInactivityTimeout");

    const isActiveObj =
      activeType === "active"
        ? { isActive: true, ...incidentInactivityFilter?.filter }
        : activeType === "inactive"
        ? { isActive: false }
        : {};

    const assignedUnitsObj = assignedUnit
      ? {
          OR: [
            { unitsInvolved: { some: { id: assignedUnit } } },
            { unitsInvolved: { some: { officerId: assignedUnit } } },
            { unitsInvolved: { some: { emsFdDeputyId: assignedUnit } } },
            { unitsInvolved: { some: { combinedLeoId: assignedUnit } } },
            { unitsInvolved: { some: { combinedEmsFdId: assignedUnit } } },
          ],
        }
      : {};
    const where = { ...isActiveObj, ...assignedUnitsObj };

    const [totalCount, incidents] = await Promise.all([
      prisma.leoIncident.count({ where, orderBy: { caseNumber: "desc" } }),
      prisma.leoIncident.findMany({
        where,
        include: incidentInclude,
        orderBy: activeType === "active" ? { updatedAt: "desc" } : { caseNumber: "desc" },
        take: includeAll ? undefined : 25,
        skip: includeAll ? undefined : skip,
      }),
    ]);

    return { totalCount, incidents: incidents.map(officerOrDeputyToUnit) };
  }

  @Get("/:id")
  @Description("Get an incident by its id")
  @UsePermissions({
    permissions: [Permissions.Dispatch, Permissions.ViewIncidents, Permissions.ManageIncidents],
    fallback: (u) => u.isDispatch || u.isLeo,
  })
  async getIncidentById(
    @PathParams("id") id: string,
  ): Promise<APITypes.GetIncidentByIdData<"leo">> {
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
  ): Promise<APITypes.PostIncidentsData<"leo">> {
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
      include: {
        unitsInvolved: true,
      },
    });

    const unitIds = (data.unitsInvolved ?? []) as string[];
    if (data.unitsInvolved) {
      await assignUnitsInvolvedToIncident({
        incident,
        maxAssignmentsToIncidents,
        unitIds,
        type: "leo",
      });
    }

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
    @QueryParams("force", Boolean) force = false,
  ): Promise<APITypes.PutAssignUnassignIncidentsData<"leo">> {
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
      "combined-leo": "combinedLeoId",
      "combined-ems-fd": "combinedEmsFdId",
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
        throw new BadRequest("alreadyAssignedToIncident");
      }

      await prisma.incidentInvolvedUnit.create({
        data: {
          incidentId,
          [types[type]]: unit.id,
        },
      });
    } else {
      if (!existing) {
        throw new BadRequest("notAssignedToIncident");
      }

      await prisma.incidentInvolvedUnit.delete({
        where: { id: existing.id },
      });
    }

    const prismaNames = {
      leo: "officer",
      "ems-fd": "emsFdDeputy",
      "combined-leo": "combinedLeoUnit",
      "combined-ems-fd": "combinedEmsFdUnit",
    } as const;
    const prismaName = prismaNames[type];

    // @ts-expect-error method has same properties
    await prisma[prismaName].update({
      where: { id: unit.id },
      data: {
        activeIncidentId: await getNextIncidentId({
          incidentId: incident.id,
          type: assignType,
          unit,
          force,
        }),
      },
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
    this.socket.emitUpdateActiveIncident(normalizedIncident);

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
  ): Promise<APITypes.PutIncidentByIdData<"leo">> {
    const data = validateSchema(LEO_INCIDENT_SCHEMA, body);
    const maxAssignmentsToIncidents = cad.miscCadSettings.maxAssignmentsToIncidents ?? Infinity;

    const incident = await prisma.leoIncident.findUnique({
      where: { id: incidentId },
      include: { unitsInvolved: true },
    });

    if (!incident) {
      throw new NotFound("notFound");
    }

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

    const unitIds = (data.unitsInvolved ?? []) as string[];
    if (data.unitsInvolved) {
      await assignUnitsInvolvedToIncident({
        incident,
        maxAssignmentsToIncidents,
        unitIds,
        type: "leo",
      });
    }

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
}
