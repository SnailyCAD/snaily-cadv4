import {
  CAD_MISC_SETTINGS_SCHEMA,
  CAD_SETTINGS_SCHEMA,
  DISABLED_FEATURES_SCHEMA,
  UPDATE_DEFAULT_PERMISSIONS_SCHEMA,
  API_TOKEN_SCHEMA,
  BLACKLISTED_WORD_SCHEMA,
} from "@snailycad/schemas";
import { Controller } from "@tsed/di";
import { BodyParams, Context, PathParams, QueryParams } from "@tsed/platform-params";
import { ContentType, Delete, Description, Get, Post, Put } from "@tsed/schema";
import { prisma } from "lib/data/prisma";
import { CAD_SELECT, IsAuth, setCADFeatures } from "middlewares/auth/is-auth";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { MultipartFile, type PlatformMulterFile, Req, Res, UseBefore } from "@tsed/common";
import { Socket } from "services/socket-service";
import { nanoid } from "nanoid";
import { validateSchema } from "lib/data/validate-schema";
import {
  type ApiToken,
  type cad,
  type Feature,
  type JailTimeScale,
  type Prisma,
} from "@prisma/client";
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
import { hasPermission } from "@snailycad/permissions";
import { parseImportFile } from "~/utils/file";
import { getPrismaModelOrderBy } from "~/utils/order-by";

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

    const hasManageCadSettingsPermissions = user
      ? hasPermission({
          permissionsToCheck: [Permissions.ManageCADSettings],
          userToCheck: user,
        })
      : false;

    const cad = await prisma.cad.findFirst({
      select: {
        ...CAD_SELECT({
          includeDiscordRoles: true,
          selectCADsettings: hasManageCadSettingsPermissions,
        }),
        registrationCode: true,
      },
    });

    const hasManageCADSettingsPermissions = user
      ? hasPermission({
          permissionsToCheck: [Permissions.ManageCADSettings],
          userToCheck: user,
        })
      : false;

    const registrationCode = hasManageCADSettingsPermissions
      ? cad?.registrationCode
      : Boolean(cad?.registrationCode);

    return {
      ...setCADFeatures(cad),
      registrationCode,
      version,
    } as unknown as APITypes.GetCADSettingsData;
  }

  @Get("/audit-logs")
  async getAuditLogs(
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("query", String) query?: string,
    @QueryParams("type", String) type?: string,
    @QueryParams("sorting") sorting = "",
  ): Promise<any> {
    const OR: Prisma.Enumerable<Prisma.AuditLogWhereInput> = [];
    const _typeWhere: Prisma.Enumerable<Prisma.AuditLogWhereInput> | undefined =
      type && Object.hasOwn(AuditLogActionType, type)
        ? { action: { string_contains: type, path: ["type"] } }
        : undefined;

    if (_typeWhere) {
      OR.push(_typeWhere);
    }

    if (query) {
      OR.push({ action: { string_contains: query } });
      OR.push({ executor: { username: { contains: query, mode: "insensitive" } } });
    }

    const where = { OR: OR.length > 0 ? OR : undefined };

    const orderBy = getPrismaModelOrderBy(sorting);
    const [totalCount, auditLogs] = await prisma.$transaction([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        take: 35,
        skip,
        orderBy: sorting ? orderBy : { createdAt: "desc" },
        include: { executor: { select: userProperties } },
        where,
      }),
    ]);

    return { totalCount, logs: parseAuditLogs(auditLogs) as any };
  }

  @Put("/")
  @UseBefore(IsAuth)
  @UsePermissions({
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
        timeZone: data.timeZone || null,
        miscCadSettings: {
          update: {
            cadOGDescription: data.cadOGDescription || null,
            roleplayEnabled: data.roleplayEnabled,
            authScreenBgImageId:
              data.authScreenBgImageId === null ? null : data.authScreenBgImageId || undefined,
            authScreenHeaderImageId:
              data.authScreenHeaderImageId === null
                ? null
                : data.authScreenHeaderImageId || undefined,
          },
        },
      },
      include: { features: true, miscCadSettings: true, apiToken: true },
    });

    this.socket.emitUpdateAop(updated.areaOfPlay);

    if (typeof data.roleplayEnabled !== "undefined") {
      this.socket.emitUpdateRoleplayStopped(data.roleplayEnabled);
    }

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
    permissions: [Permissions.ManageCADSettings],
  })
  async updateCadFeatures(
    @Context("cad") cad: cad & { features?: Record<Feature, boolean> },
    @Context("sessionUserId") sessionUserId: string,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PutCADFeaturesData> {
    const data = validateSchema(DISABLED_FEATURES_SCHEMA, body);

    await prisma.$transaction(
      data.features.map((feature) => {
        const createUpdateData = {
          isEnabled: feature.isEnabled,
          feature: feature.feature as Feature,
          extraFields: JSON.stringify(feature.extraFields),
          cadId: cad.id,
        };

        return prisma.cadFeature.upsert({
          where: { feature: feature.feature as Feature },
          create: createUpdateData,
          update: createUpdateData,
        });
      }),
    );

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
        authScreenBgImageId: data.authScreenBgImageId || null,
        authScreenHeaderImageId: data.authScreenHeaderImageId || null,
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
        driversLicenseMaxPoints: data.driversLicenseMaxPoints,
        pilotLicenseMaxPoints: data.pilotLicenseMaxPoints,
        weaponLicenseMaxPoints: data.weaponLicenseMaxPoints,
        waterLicenseMaxPoints: data.waterLicenseMaxPoints,
        pilotLicenseTemplate: data.pilotLicenseTemplate,
        driversLicenseTemplate: data.driversLicenseTemplate,
        weaponLicenseTemplate: data.weaponLicenseTemplate,
        waterLicenseTemplate: data.waterLicenseTemplate,
        pilotLicenseNumberLength: data.pilotLicenseNumberLength,
        driversLicenseNumberLength: data.driversLicenseNumberLength,
        weaponLicenseNumberLength: data.weaponLicenseNumberLength,
        waterLicenseNumberLength: data.waterLicenseNumberLength,
        signal100RepeatAmount: data.signal100RepeatAmount,
        signal100RepeatIntervalMs: data.signal100RepeatIntervalMs,
        huntingLicenseTemplate: data.huntingLicenseTemplate,
        huntingLicenseMaxPoints: data.huntingLicenseMaxPoints,
        huntingLicenseNumberLength: data.huntingLicenseNumberLength,
        fishingLicenseTemplate: data.fishingLicenseTemplate,
        fishingLicenseMaxPoints: data.fishingLicenseMaxPoints,
        fishingLicenseNumberLength: data.fishingLicenseNumberLength,
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
        token: `sng_${nanoid(56)}`,
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
  @Description("Regenerate the global API token")
  @UsePermissions({
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
        token: `sng_${nanoid(56)}`,
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

  @Get("/blacklisted-words")
  @UseBefore(IsAuth)
  @UsePermissions({
    permissions: [Permissions.ManageCADSettings],
  })
  async getBlacklistedWords(
    @QueryParams("query", String) query?: string,
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("includeAll", Boolean) includeAll = false,
    @QueryParams("sorting") sorting: string = "",
  ): Promise<APITypes.GetBlacklistedWordsData> {
    const orderBy = getPrismaModelOrderBy(sorting);

    const [totalCount, blacklistedWords] = await prisma.$transaction([
      prisma.blacklistedWord.count({
        where: query ? { word: { contains: query, mode: "insensitive" } } : undefined,
      }),
      prisma.blacklistedWord.findMany({
        where: query ? { word: { contains: query, mode: "insensitive" } } : undefined,
        take: includeAll ? undefined : 35,
        skip: includeAll ? undefined : skip,
        orderBy,
      }),
    ]);

    return {
      blacklistedWords,
      totalCount,
    };
  }

  @Post("/blacklisted-words")
  @UseBefore(IsAuth)
  @UsePermissions({
    permissions: [Permissions.ManageCADSettings],
  })
  async addBlacklistedWord(
    @MultipartFile("file") file: PlatformMulterFile,
  ): Promise<APITypes.PostBlacklistedWordsData> {
    const toValidateBody = parseImportFile(file);
    const validatedWords = validateSchema(BLACKLISTED_WORD_SCHEMA, toValidateBody);

    const words = await prisma.$transaction(
      validatedWords.map((word) =>
        prisma.blacklistedWord.create({
          data: {
            word: word.word.toLowerCase(),
          },
        }),
      ),
    );

    return words;
  }

  @Delete("/blacklisted-words/:wordId")
  @UseBefore(IsAuth)
  @UsePermissions({
    permissions: [Permissions.ManageCADSettings],
  })
  async deleteBlacklistedWord(
    @PathParams("wordId") wordId: string,
  ): Promise<APITypes.DeleteBlacklistedWordsData> {
    const existingWord = await prisma.blacklistedWord.findFirst({
      where: {
        id: wordId,
      },
    });

    if (!existingWord) {
      throw new NotFound("wordNotFound");
    }

    const word = await prisma.blacklistedWord.delete({
      where: {
        id: wordId,
      },
    });

    return Boolean(word);
  }
}
