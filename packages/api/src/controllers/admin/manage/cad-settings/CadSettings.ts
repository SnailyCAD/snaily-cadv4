import {
  CAD_MISC_SETTINGS_SCHEMA,
  CAD_SETTINGS_SCHEMA,
  DISABLED_FEATURES_SCHEMA,
  CAD_AUTO_SET_PROPERTIES,
  API_TOKEN_SCHEMA,
} from "@snailycad/schemas";
import { Controller } from "@tsed/di";
import { BodyParams, Context } from "@tsed/platform-params";
import { Delete, Get, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { CAD_SELECT, IsAuth, setDiscordAuth } from "middlewares/IsAuth";
import { BadRequest } from "@tsed/exceptions";
import { Req, Res, UseBefore } from "@tsed/common";
import { Socket } from "services/SocketService";
import { nanoid } from "nanoid";
import { validateSchema } from "lib/validateSchema";
import { cad, Feature, JailTimeScale, Rank } from "@prisma/client";
import { getCADVersion } from "@snailycad/utils/version";
import { getSessionUser } from "lib/auth/getSessionUser";
import type * as APITypes from "@snailycad/types/api";
import { Permissions, UsePermissions } from "middlewares/UsePermissions";

@Controller("/admin/manage/cad-settings")
export class ManageCitizensController {
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
      ...setDiscordAuth(cad as unknown as cad),
      registrationCode,
      version,
    } as APITypes.GetCADSettingsData;
  }

  @Put("/")
  @UseBefore(IsAuth)
  @UsePermissions({
    fallback: (u) => u.rank === Rank.OWNER,
    permissions: [Permissions.ManageCADSettings],
  })
  async updateCadSettings(
    @Context("cad") cad: cad,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PutCADSettingsData> {
    const data = validateSchema(CAD_SETTINGS_SCHEMA, body);

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

    return updated;
  }

  @Put("/features")
  @UseBefore(IsAuth)
  @UsePermissions({
    fallback: (u) => u.rank === Rank.OWNER,
    permissions: [Permissions.ManageCADSettings],
  })
  async updateCadFeatures(
    @Context("cad") cad: cad,
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

    return updated;
  }

  @Put("/misc")
  @UseBefore(IsAuth)
  @UsePermissions({
    fallback: (u) => u.rank === Rank.OWNER,
    permissions: [Permissions.ManageCADSettings],
  })
  async updateMiscSettings(
    @Context("cad") cad: cad,
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
        liveMapURL: data.liveMapURL,
        authScreenBgImageId: data.authScreenBgImageId,
        authScreenHeaderImageId: data.authScreenHeaderImageId,
        maxOfficersPerUser: data.maxOfficersPerUser,
        maxDepartmentsEachPerUser: data.maxDepartmentsEachPerUser,
        maxAssignmentsToCalls: data.maxAssignmentsToCalls,
        maxAssignmentsToIncidents: data.maxAssignmentsToIncidents,
        call911InactivityTimeout: data.call911InactivityTimeout || null,
        incidentInactivityTimeout: data.incidentInactivityTimeout || null,
        unitInactivityTimeout: data.unitInactivityTimeout || null,
        jailTimeScale: (data.jailTimeScaling || null) as JailTimeScale | null,
      },
    });

    return updated;
  }

  @Put("/auto-set-properties")
  @UseBefore(IsAuth)
  @UsePermissions({
    fallback: (u) => u.rank === Rank.OWNER,
    permissions: [Permissions.ManageCADSettings],
  })
  async updateAutoSetProperties(
    @Context("cad") cad: cad,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PutCADAutoSetPropertiesData> {
    const data = validateSchema(CAD_AUTO_SET_PROPERTIES, body);

    const autoSetProperties = await prisma.autoSetUserProperties.upsert({
      where: {
        id: cad.autoSetUserPropertiesId ?? "null",
      },
      create: {
        cad: { connect: { id: cad.id } },
        dispatch: data.dispatch,
        emsFd: data.emsFd,
        leo: data.leo,
      },
      update: {
        dispatch: data.dispatch,
        emsFd: data.emsFd,
        leo: data.leo,
      },
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

      return null;
    }

    const apiToken = await prisma.apiToken.create({
      data: {
        cad: { connect: { id: cad.id } },
        enabled: true,
        token: nanoid(56),
      },
    });

    return apiToken;
  }

  @Delete("/api-token")
  @UseBefore(IsAuth)
  @UsePermissions({
    fallback: (u) => u.rank === Rank.OWNER,
    permissions: [Permissions.ManageCADSettings],
  })
  async regenerateApiToken(@Context("cad") cad: cad) {
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

    return updated;
  }
}
