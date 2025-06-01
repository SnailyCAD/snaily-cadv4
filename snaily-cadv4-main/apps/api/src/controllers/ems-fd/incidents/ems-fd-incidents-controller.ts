import { Controller, UseBefore, UseBeforeEach } from "@tsed/common";
import { ContentType, Delete, Description, Get, Post, Put } from "@tsed/schema";
import { NotFound, InternalServerError, BadRequest } from "@tsed/exceptions";
import { QueryParams, BodyParams, Context, PathParams } from "@tsed/platform-params";
import { prisma } from "lib/data/prisma";
import { IsAuth } from "middlewares/auth/is-auth";
import { EMS_FD_INCIDENT_SCHEMA } from "@snailycad/schemas";
import {
  type Officer,
  type MiscCadSettings,
  type CombinedLeoUnit,
  DiscordWebhookType,
} from "@prisma/client";
import { validateSchema } from "lib/data/validate-schema";
import { Socket } from "services/socket-service";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import { officerOrDeputyToUnit } from "lib/leo/officerOrDeputyToUnit";
import { findUnit } from "lib/leo/findUnit";
import { getUserOfficerFromActiveOfficer } from "lib/leo/utils";
import type * as APITypes from "@snailycad/types/api";
import { getNextIncidentId } from "lib/incidents/get-next-incident-id";
import { assignUnitsInvolvedToIncident } from "lib/incidents/handle-involved-units";
import { ActiveDeputy } from "middlewares/active-deputy";
import { AuditLogActionType, createAuditLogEntry } from "@snailycad/audit-logger/server";
import { _leoProperties, assignedUnitsInclude, unitProperties } from "utils/leo/includes";
import { sendDiscordWebhook } from "~/lib/discord/webhooks";
import { User } from "@snailycad/types";
import type { APIEmbed } from "discord-api-types/v10";
import { getTranslator } from "~/utils/get-translator";
import { slateDataToString } from "@snailycad/utils/editor";

export const incidentInclude = {
  creator: { include: unitProperties },
  events: true,
  situationCode: { include: { value: true } },
  unitsInvolved: assignedUnitsInclude,
};

type ActiveTypes = "active" | "inactive" | "all";

@Controller("/ems-fd/incidents")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
export class IncidentController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/")
  @Description("Get all the created EMS/FD incidents")
  @UsePermissions({
    permissions: [
      Permissions.Dispatch,
      Permissions.ViewEmsFdIncidents,
      Permissions.ManageEmsFdIncidents,
    ],
  })
  async getAllIncidents(
    @QueryParams("activeType", String) activeType: ActiveTypes = "inactive",
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("includeAll", Boolean) includeAll = false,
    @QueryParams("assignedUnit", String) assignedUnit?: string,
  ): Promise<APITypes.GetIncidentsData<"ems-fd">> {
    const isActiveObj =
      activeType === "active"
        ? { isActive: true }
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
      prisma.emsFdIncident.count({ where, orderBy: { caseNumber: "desc" } }),
      prisma.emsFdIncident.findMany({
        where,
        include: incidentInclude,
        orderBy: { caseNumber: "desc" },
        take: includeAll ? undefined : 25,
        skip: includeAll ? undefined : skip,
      }),
    ]);

    return { totalCount, incidents: incidents.map(officerOrDeputyToUnit) };
  }

  @Get("/:id")
  @Description("Get an EMS/FD incident by its id")
  @UsePermissions({
    permissions: [
      Permissions.Dispatch,
      Permissions.ViewEmsFdIncidents,
      Permissions.ManageEmsFdIncidents,
    ],
  })
  async getIncidentById(
    @PathParams("id") id: string,
  ): Promise<APITypes.GetIncidentByIdData<"ems-fd">> {
    const incident = await prisma.emsFdIncident.findUnique({
      where: { id },
      include: incidentInclude,
    });

    return officerOrDeputyToUnit(incident);
  }

  @UseBefore(ActiveDeputy)
  @Post("/")
  @UsePermissions({
    permissions: [Permissions.Dispatch, Permissions.ManageEmsFdIncidents],
  })
  async createIncident(
    @BodyParams() body: unknown,
    @Context("cad") cad: { miscCadSettings: MiscCadSettings },
    @Context("activeOfficer") activeOfficer: (CombinedLeoUnit & { officers: Officer[] }) | Officer,
    @Context("sessionUserId") sessionUserId: string,
    @Context("user") user: User,
  ): Promise<APITypes.PostIncidentsData<"ems-fd">> {
    const data = validateSchema(EMS_FD_INCIDENT_SCHEMA, body);
    const officer = getUserOfficerFromActiveOfficer({
      userId: sessionUserId,
      allowDispatch: true,
      activeOfficer,
    });
    const maxAssignmentsToIncidents = cad.miscCadSettings.maxAssignmentsToIncidents ?? Infinity;

    const incident = await prisma.emsFdIncident.create({
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
        address: data.address ?? null,
        fireType: data.fireType ?? null,
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
        type: "ems-fd",
      });
    }

    const updated = await prisma.emsFdIncident.findUnique({
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

    const webhookData = await createIncidentWebhookData(corrected, user.locale ?? "en");
    await sendDiscordWebhook({
      data: webhookData,
      type: DiscordWebhookType.EMS_FD_INCIDENT_CREATED,
      extraMessageData: { userDiscordId: user.discordId },
    });

    return corrected;
  }

  @Post("/:type/:incidentId")
  @UsePermissions({
    permissions: [Permissions.Dispatch, Permissions.Leo, Permissions.EmsFd],
  })
  async assignToIncident(
    @PathParams("type") assignType: "assign" | "unassign",
    @PathParams("incidentId") incidentId: string,
    @BodyParams("unit") rawUnitId: string | null,
    @QueryParams("force", Boolean) force = false,
  ): Promise<APITypes.PutAssignUnassignIncidentsData<"ems-fd">> {
    if (!rawUnitId) {
      throw new BadRequest("unitIsRequired");
    }

    const { unit, type } = await findUnit(rawUnitId);
    if (!unit) {
      throw new NotFound("unitNotFound");
    }

    const incident = await prisma.emsFdIncident.findUnique({
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

    const updated = await prisma.emsFdIncident.findUniqueOrThrow({
      where: {
        id: incident.id,
      },
      include: incidentInclude,
    });

    const normalizedIncident = officerOrDeputyToUnit(updated);
    this.socket.emitUpdateActiveIncident(normalizedIncident);

    return normalizedIncident;
  }

  @UseBefore(ActiveDeputy)
  @Put("/:id")
  @UsePermissions({
    permissions: [Permissions.Dispatch, Permissions.ManageEmsFdIncidents],
  })
  async updateIncident(
    @BodyParams() body: unknown,
    @Context("cad") cad: { miscCadSettings: MiscCadSettings },
    @PathParams("id") incidentId: string,
  ): Promise<APITypes.PutIncidentByIdData<"ems-fd">> {
    const data = validateSchema(EMS_FD_INCIDENT_SCHEMA, body);
    const maxAssignmentsToIncidents = cad.miscCadSettings.maxAssignmentsToIncidents ?? Infinity;

    const incident = await prisma.emsFdIncident.findUnique({
      where: { id: incidentId },
      include: { unitsInvolved: true },
    });

    if (!incident) {
      throw new NotFound("notFound");
    }

    await prisma.emsFdIncident.update({
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
        address: data.address ?? null,
        fireType: data.fireType ?? null,
      },
    });

    const unitIds = (data.unitsInvolved ?? []) as string[];
    if (data.unitsInvolved) {
      await assignUnitsInvolvedToIncident({
        incident,
        maxAssignmentsToIncidents,
        unitIds,
        type: "ems-fd",
      });
    }

    const updated = await prisma.emsFdIncident.findUniqueOrThrow({
      where: { id: incident.id },
      include: incidentInclude,
    });

    const normalizedIncident = officerOrDeputyToUnit(updated);

    this.socket.emitUpdateActiveIncident(normalizedIncident);
    await this.socket.emitUpdateOfficerStatus();
    await this.socket.emitUpdateDeputyStatus();

    return normalizedIncident;
  }

  @Delete("/purge")
  @UsePermissions({
    permissions: [Permissions.PurgeEmsFdIncidents],
  })
  async purgeIncidents(
    @BodyParams("ids") ids: string[],
    @Context("sessionUserId") sessionUserId: string,
  ) {
    if (!Array.isArray(ids)) return false;

    await prisma.$transaction(ids.map((id) => prisma.emsFdIncident.delete({ where: { id } })));

    await createAuditLogEntry({
      translationKey: "emsFdIncidentsPurged",
      action: { type: AuditLogActionType.EmsIncidentsPurged, new: ids },
      executorId: sessionUserId,
      prisma,
    });

    return true;
  }

  @Delete("/:id")
  @Description("Delete an incident by its id")
  @UsePermissions({
    permissions: [Permissions.Dispatch, Permissions.ManageEmsFdIncidents],
  })
  async deleteIncident(
    @PathParams("id") incidentId: string,
  ): Promise<APITypes.DeleteIncidentByIdData> {
    const incident = await prisma.emsFdIncident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new NotFound("incidentNotFound");
    }

    await prisma.emsFdIncident.delete({
      where: { id: incidentId },
    });

    return true;
  }
}

export async function createIncidentWebhookData(
  incident: APITypes.PostIncidentsData<"ems-fd" | "leo">,
  locale: string,
) {
  const t = await getTranslator({
    type: "webhooks",
    namespace: "Incidents",
    locale,
  });

  const isEmsFd = "fireType" in incident;
  const title = isEmsFd ? t("createdEms") : t("createdLeo");

  return {
    embeds: [
      {
        title,
        description: slateDataToString(incident.descriptionData) || incident.description || "---",
        fields: [
          {
            inline: true,
            name: t("fireArmsInvolved"),
            value: incident.firearmsInvolved ? t("yes") : t("no"),
          },
          {
            inline: true,
            name: t("injuriesOrFatalities"),
            value: incident.injuriesOrFatalities ? t("yes") : t("no"),
          },
          {
            inline: true,
            name: t("arrestsMade"),
            value: incident.arrestsMade ? t("yes") : t("no"),
          },
          {
            name: t("situationCode"),
            value: incident.situationCode?.value.value ?? t("none"),
            inline: true,
          },
          {
            name: t("postal"),
            value: incident.postal ?? t("none"),
            inline: true,
          },
        ],
      },
    ],
  } as { embeds: APIEmbed[] };
}
