import {
  CAD_MISC_SETTINGS_SCHEMA,
  CAD_SETTINGS_SCHEMA,
  DISABLED_FEATURES_SCHEMA,
  UPDATE_DEFAULT_PERMISSIONS_SCHEMA,
  API_TOKEN_SCHEMA,
} from "@snailycad/schemas";
import { Controller } from "@tsed/di";
import { BodyParams, Context, QueryParams } from "@tsed/platform-params";
import { ContentType, Delete, Get, Put } from "@tsed/schema";
import { prisma } from "lib/data/prisma";
import { CAD_SELECT, IsAuth, setCADFeatures } from "middlewares/is-auth";
import { BadRequest } from "@tsed/exceptions";
import { Req, Res, UseBefore } from "@tsed/common";
import { Socket } from "services/socket-service";
import { nanoid } from "nanoid";
import { validateSchema } from "lib/data/validate-schema";
import { ApiToken, cad, Feature, JailTimeScale, Prisma, Rank } from "@prisma/client";
import { getCADVersion } from "@snailycad/utils/version";
import { getSessionUser, userProperties } from "lib/auth/getSessionUser";
import type * as APITypes from "@snailycad/types/api";
import { Permissions, UsePermissions } from "middlewares/use-permissions";
import {
  AuditLogActionType,
  createAuditLogEntry,
  parseAuditLogs,
} from "@snailycad/audit-logger/server";
import type { MiscCadSettings } from "@snailycad/types";
import { createFeaturesObject } from "middlewares/is-enabled";

@Controller("/admin/manage/cad-settings")
@ContentType("application/json")
export class CADSettingsController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/")
  async getCadSettings(
    @Req() request: Req,
    @Res() response: Res,
  ): Promise<APITypes.GetCADSettingsData> {
    const user = await getSessionUser({ req: request, res: response, returnNullOnError: true });
    const version = await getCADVersion();

    const cad = await prisma.cad.findFirst({
      select: { ...CAD_SELECT(user, true), registrationCode: true },
    });

    const registrationCode =
      user?.rank === Rank.OWNER ? cad?.registrationCode : !!cad?.registrationCode;

    return {
      ...setCADFeatures(cad),
      registrationCode,
      version,
    } as APITypes.GetCADSettingsData;
  }

  @Get("/audit-logs")
  async getAuditLogs(
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("query", String) query?: string,
    @QueryParams("type", String) type?: string,
  ): Promise<any> {
    const OR: Prisma.Enumerable<Prisma.AuditLogWhereInput> = [];
    const _typeWhere =
      type && Object.hasOwn(AuditLogActionType, type)
        ? { action: { string_contains: type } }
        : undefined;

    if (query) {
      OR.push({ action: { string_contains: query } });
      OR.push({ executor: { username: { contains: query, mode: "insensitive" } } });
    }

    const where = { OR: query ? OR : undefined, ..._typeWhere };

    const [totalCount, auditLogs] = await prisma.$transaction([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        take: 35,
        skip,
        orderBy: { createdAt: "desc" },
        include: { executor: { select: userProperties } },
        where,
      }),
    ]);

    return { totalCount, logs: parseAuditLogs(auditLogs) as any };
  }

  @Put("/")
  @UseBefore(IsAuth)
  @UsePermissions({
    fallback: (u) => u.rank === Rank.OWNER,
    permissions: [Permissions.ManageCADSettings],
  })
  async updateCadSettings(
    @Context("sessionUserId") sessionUserId: string,
    @Context("cad") cad: cad,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PutCADSettingsData> {
    const data = validateSchema(CAD_SETTINGS_SCHEMA, body);

    // this is fetched to get correct diff results
    const _cad = await prisma.cad.findUnique({
      where: { id: cad.id },
      include: { features: true, miscCadSettings: true, apiToken: true },
    });

    const updated = await prisma.cad.update({
      where: { id: cad.id },
      data: {
        name: data.name,
        areaOfPlay: data.areaOfPlay,
        steamApiKey: data.steamApiKey,
        towWhitelisted: data.towWhitelisted,
        taxiWhitelisted: data.taxiWhitelisted,
        whitelisted: data.whitelisted,
        businessWhitelisted: data.businessWhitelisted,
        registrationCode: data.registrationCode,
        logoId: data.image,
        miscCadSettings: { update: { roleplayEnabled: data.roleplayEnabled } },
      },
      include: { features: true, miscCadSettings: true, apiToken: true },
    });

    this.socket.emitUpdateAop(updated.areaOfPlay);
    this.socket.emitUpdateRoleplayStopped(data.roleplayEnabled);

    await createAuditLogEntry({
      action: {
        type: AuditLogActionType.CadSettingsUpdate,
        new: setCADFeatures(updated),
        previous: setCADFeatures(_cad) as any,
      },
      prisma,
      executorId: sessionUserId,
    });

    return setCADFeatures(updated);
  }

  @Put("/features")
  @UseBefore(IsAuth)
  @UsePermissions({
    fallback: (u) => u.rank === Rank.OWNER,
    permissions: [Permissions.ManageCADSettings],
  })
  async updateCadFeatures(
    @Context("cad") cad: cad & { features?: Record<Feature, boolean> },
    @Context("sessionUserId") sessionUserId: string,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PutCADFeaturesData> {
    const data = validateSchema(DISABLED_FEATURES_SCHEMA, body);

    for (const feature of data.features) {
      const createUpdateData = {
        isEnabled: feature.isEnabled,
        feature: feature.feature as Feature,
        cadId: cad.id,
      };

      await prisma.cadFeature.upsert({
        where: { feature: feature.feature as Feature },
        create: createUpdateData,
        update: createUpdateData,
      });
    }

    const updated = await prisma.cad.findUniqueOrThrow({
      where: { id: cad.id },
      include: { features: true, miscCadSettings: true, apiToken: true },
    });

    const previousEnabledFeatures = cad.features;
    const newEnabledFeatures = createFeaturesObject(updated.features);

    await createAuditLogEntry({
      action: {
        type: AuditLogActionType.CADFeaturesUpdate,
        new: newEnabledFeatures,
        previous: previousEnabledFeatures!,
      },
      prisma,
      executorId: sessionUserId,
    });

    return setCADFeatures(updated);
  }

  @Put("/misc")
  @UseBefore(IsAuth)
  @UsePermissions({
    fallback: (u) => u.rank === Rank.OWNER,
    permissions: [Permissions.ManageCADSettings],
  })
  async updateMiscSettings(
    @Context("sessionUserId") sessionUserId: string,
    @Context("cad") cad: cad & { miscCadSettings: MiscCadSettings },
    @BodyParams() body: unknown,
  ): Promise<APITypes.PutCADMiscSettingsData> {
    const data = validateSchema(CAD_MISC_SETTINGS_SCHEMA, body);

    const updated = await prisma.miscCadSettings.update({
      where: {
        id: cad.miscCadSettingsId ?? "null",
      },
      data: {
        cadOGDescription: data.cadOGDescription || null,
        heightPrefix: data.heightPrefix,
        weightPrefix: data.weightPrefix,
        maxBusinessesPerCitizen: data.maxBusinessesPerCitizen,
        maxCitizensPerUser: data.maxCitizensPerUser,
        maxPlateLength: data.maxPlateLength,
        maxDivisionsPerOfficer: data.maxDivisionsPerOfficer,
        pairedUnitTemplate: data.pairedUnitTemplate,
        callsignTemplate: data.callsignTemplate,
        caseNumberTemplate: data.caseNumberTemplate,
        authScreenBgImageId: data.authScreenBgImageId,
        authScreenHeaderImageId: data.authScreenHeaderImageId,
        maxOfficersPerUser: data.maxOfficersPerUser,
        maxDepartmentsEachPerUser: data.maxDepartmentsEachPerUser,
        maxAssignmentsToCalls: data.maxAssignmentsToCalls,
        maxAssignmentsToIncidents: data.maxAssignmentsToIncidents,
        call911InactivityTimeout: data.call911InactivityTimeout || null,
        incidentInactivityTimeout: data.incidentInactivityTimeout || null,
        unitInactivityTimeout: data.unitInactivityTimeout || null,
        activeDispatchersInactivityTimeout: data.activeDispatchersInactivityTimeout || null,
        boloInactivityTimeout: data.boloInactivityTimeout || null,
        activeWarrantsInactivityTimeout: data.activeWarrantsInactivityTimeout || null,
        jailTimeScale: (data.jailTimeScaling || null) as JailTimeScale | null,
      },
      include: { webhooks: true },
    });

    await createAuditLogEntry({
      action: {
        type: AuditLogActionType.MiscCadSettingsUpdate,
        new: updated,
        previous: cad.miscCadSettings,
      },
      prisma,
      executorId: sessionUserId,
    });

    return updated;
  }

  @Put("/default-permissions")
  @UseBefore(IsAuth)
  @UsePermissions({
    fallback: (u) => u.rank === Rank.OWNER,
    permissions: [Permissions.ManageCADSettings],
  })
  async updateDefaultPermissions(
    @Context("cad") cad: cad,
    @BodyParams() body: unknown,
    @Context("sessionUserId") sessionUserId: string,
  ): Promise<APITypes.PutCADDefaultPermissionsData> {
    const data = validateSchema(UPDATE_DEFAULT_PERMISSIONS_SCHEMA, body);

    const previous = cad.autoSetUserPropertiesId
      ? await prisma.autoSetUserProperties.findUnique({
          where: { id: cad.autoSetUserPropertiesId },
        })
      : null;

    const autoSetProperties = await prisma.autoSetUserProperties.upsert({
      where: {
        id: cad.autoSetUserPropertiesId ?? "null",
      },
      create: {
        cad: { connect: { id: cad.id } },
        dispatch: false,
        emsFd: false,
        leo: false,
        defaultPermissions: data.defaultPermissions,
      },
      update: {
        dispatch: false,
        emsFd: false,
        leo: false,
        defaultPermissions: data.defaultPermissions,
      },
    });

    await createAuditLogEntry({
      action: {
        type: AuditLogActionType.CadAutoSetPropertiesUpdate,
        previous,
        new: autoSetProperties,
      },
      prisma,
      executorId: sessionUserId,
    });

    return autoSetProperties;
  }

  @Put("/api-token")
  @UseBefore(IsAuth)
  @UsePermissions({
    fallback: (u) => u.rank === Rank.OWNER,
    permissions: [Permissions.ManageCADSettings],
  })
  async updateApiToken(
    @Context("cad") cad: cad,
    @BodyParams() body: unknown,
    @Context("sessionUserId") sessionUserId: string,
  ): Promise<APITypes.PutCADApiTokenData> {
    const data = validateSchema(API_TOKEN_SCHEMA, body);

    const existing =
      cad.apiTokenId &&
      (await prisma.apiToken.findFirst({
        where: {
          id: cad.apiTokenId,
        },
      }));

    if (existing && data.enabled === true) {
      const updated = await prisma.apiToken.update({
        where: { id: existing.id },
        data: { enabled: data.enabled },
      });

      return updated;
    }

    if (data.enabled === false) {
      if (!cad.apiTokenId) {
        return null;
      }

      await prisma.apiToken.delete({
        where: { id: cad.apiTokenId },
      });

      await createAuditLogEntry({
        translationKey: "cadAPITokenRemoved",
        action: {
          type: AuditLogActionType.CadAPITokenRemoved,
        },
        prisma,
        executorId: sessionUserId,
      });

      return null;
    }

    const apiToken = await prisma.apiToken.create({
      data: {
        cad: { connect: { id: cad.id } },
        enabled: true,
        token: nanoid(56),
      },
    });

    await createAuditLogEntry({
      translationKey: "cadAPITokenEnabled",
      action: {
        type: AuditLogActionType.CadAPITokenEnabled,
      },
      prisma,
      executorId: sessionUserId,
    });

    return apiToken;
  }

  @Delete("/api-token")
  @UseBefore(IsAuth)
  @UsePermissions({
    fallback: (u) => u.rank === Rank.OWNER,
    permissions: [Permissions.ManageCADSettings],
  })
  async regenerateApiToken(
    @Context("cad") cad: cad & { apiToken: ApiToken },
    @Context("sessionUserId") sessionUserId: string,
  ) {
    if (!cad.apiTokenId) {
      throw new BadRequest("noApiTokenId");
    }

    const updated = await prisma.apiToken.update({
      where: {
        id: cad.apiTokenId,
      },
      data: {
        token: nanoid(56),
      },
    });

    await createAuditLogEntry({
      translationKey: "cadAPITokenRegenerated",
      action: {
        type: AuditLogActionType.CadAPITokenRegenerated,
      },
      prisma,
      executorId: sessionUserId,
    });

    return updated;
  }
}
