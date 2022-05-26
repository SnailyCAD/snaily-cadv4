import {
  CAD_MISC_SETTINGS_SCHEMA,
  CAD_SETTINGS_SCHEMA,
  DISABLED_FEATURES_SCHEMA,
  CAD_AUTO_SET_PROPERTIES,
} from "@snailycad/schemas";
import { Controller } from "@tsed/di";
import { BodyParams, Context } from "@tsed/platform-params";
import { Delete, Get, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { CAD_SELECT, IsAuth, setDiscordAuth as setDiscordAuth } from "middlewares/IsAuth";
import { BadRequest } from "@tsed/exceptions";
import { Req, UseBefore } from "@tsed/common";
import { Socket } from "services/SocketService";
import { nanoid } from "nanoid";
import { validateSchema } from "lib/validateSchema";
import type { cad, Feature, JailTimeScale } from "@prisma/client";
import { getCADVersion } from "@snailycad/utils/version";
import { getSessionUser } from "lib/auth/getSessionUser";

@Controller("/admin/manage/cad-settings")
export class ManageCitizensController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/")
  async getCadSettings(@Req() request: Req) {
    const user = await getSessionUser(request, true);
    const version = await getCADVersion();

    const cad = await prisma.cad.findFirst({
      select: { ...CAD_SELECT(user), registrationCode: true },
    });

    return { ...setDiscordAuth(cad), registrationCode: !!cad?.registrationCode, version };
  }

  @Put("/")
  @UseBefore(IsAuth)
  async updateCadSettings(@Context() ctx: Context, @BodyParams() body: unknown) {
    const data = validateSchema(CAD_SETTINGS_SCHEMA, body);

    const updated = await prisma.cad.update({
      where: {
        id: ctx.get("cad").id,
      },
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
        miscCadSettings: {
          update: {
            roleplayEnabled: data.roleplayEnabled,
          },
        },
      },
    });

    this.socket.emitUpdateAop(updated.areaOfPlay);
    this.socket.emitUpdateRoleplayStopped(data.roleplayEnabled);

    return updated;
  }

  @Put("/features")
  @UseBefore(IsAuth)
  async updateCadFeatures(@Context("cad") cad: cad, @BodyParams() body: unknown) {
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

    const updated = prisma.cad.findUnique({
      where: { id: cad.id },
      include: { features: true },
    });

    return updated;
  }

  @Put("/misc")
  @UseBefore(IsAuth)
  async updateMiscSettings(@Context("cad") ctx: cad, @BodyParams() body: unknown) {
    const data = validateSchema(CAD_MISC_SETTINGS_SCHEMA, body);

    const updated = await prisma.miscCadSettings.update({
      where: {
        id: ctx.miscCadSettingsId ?? "null",
      },
      data: {
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
        inactivityTimeout: data.inactivityTimeout || null,
        jailTimeScale: (data.jailTimeScaling || null) as JailTimeScale | null,
      },
    });

    return updated;
  }

  @Put("/auto-set-properties")
  @UseBefore(IsAuth)
  async updateAutoSetProperties(@Context("cad") ctx: cad, @BodyParams() body: unknown) {
    const data = validateSchema(CAD_AUTO_SET_PROPERTIES, body);

    const autoSetProperties = await prisma.autoSetUserProperties.upsert({
      where: {
        id: ctx.autoSetUserPropertiesId ?? "null",
      },
      create: {
        cad: { connect: { id: ctx.id } },
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
  async updateApiToken(@Context() ctx: Context, @BodyParams() body: any) {
    const cad = ctx.get("cad") as cad;

    const existing =
      cad.apiTokenId &&
      (await prisma.apiToken.findFirst({
        where: {
          id: cad.apiTokenId,
        },
      }));

    if (existing && body.enabled === true) {
      const updated = await prisma.apiToken.update({
        where: {
          id: existing.id,
        },
        data: {
          enabled: body.enabled,
        },
      });

      return updated;
    }

    if (body.enabled === false) {
      cad.apiTokenId &&
        (await prisma.apiToken.delete({
          where: {
            id: cad.apiTokenId,
          },
        }));

      return { enabled: false, token: "" };
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
  async regenerateApiToken(@Context() ctx: Context) {
    const cad = ctx.get("cad");

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
