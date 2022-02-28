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
import { IsAuth, setDiscordAUth } from "middlewares/index";
import { BadRequest } from "@tsed/exceptions";
import { UseBefore } from "@tsed/common";
import { Socket } from "services/SocketService";
import { nanoid } from "nanoid";
import { validateSchema } from "lib/validateSchema";
import type { cad, Feature } from "@prisma/client";

@Controller("/admin/manage/cad-settings")
export class ManageCitizensController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/")
  async getCadSettings() {
    const cad = await prisma.cad.findFirst({
      select: {
        name: true,
        areaOfPlay: true,
        registrationCode: true,
        disabledFeatures: true,
        miscCadSettings: true,
      },
    });

    return { ...setDiscordAUth(cad), registrationCode: !!cad?.registrationCode };
  }

  @UseBefore(IsAuth)
  @Put("/")
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

  @UseBefore(IsAuth)
  @Put("/features")
  async updateDisabledFeatures(@Context() ctx: Context, @BodyParams() body: unknown) {
    const data = validateSchema(DISABLED_FEATURES_SCHEMA, body);

    const updated = await prisma.cad.update({
      where: {
        id: ctx.get("cad").id,
      },
      data: {
        disabledFeatures: data.features as Feature[],
      },
    });

    return updated;
  }

  @UseBefore(IsAuth)
  @Put("/misc")
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
      },
    });

    return updated;
  }

  @UseBefore(IsAuth)
  @Put("/auto-set-properties")
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

  @UseBefore(IsAuth)
  @Put("/api-token")
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

  @UseBefore(IsAuth)
  @Delete("/api-token")
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
