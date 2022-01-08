import {
  validate,
  CAD_MISC_SETTINGS_SCHEMA,
  CAD_SETTINGS_SCHEMA,
  DISABLED_FEATURES_SCHEMA,
} from "@snailycad/schemas";
import { Controller } from "@tsed/di";
import { BodyParams, Context } from "@tsed/platform-params";
import { Delete, Get, JsonRequestBody, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { IsAuth, setDiscordAUth } from "middlewares/index";
import { BadRequest } from "@tsed/exceptions";
import { UseBefore } from "@tsed/common";
import { Socket } from "services/SocketService";
import { nanoid } from "nanoid";

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
  async updateCadSettings(@Context() ctx: Context, @BodyParams() body: JsonRequestBody) {
    const error = validate(CAD_SETTINGS_SCHEMA, body.toJSON(), true);

    if (error) {
      throw new BadRequest(error);
    }

    const updated = await prisma.cad.update({
      where: {
        id: ctx.get("cad").id,
      },
      data: {
        name: body.get("name"),
        areaOfPlay: body.get("areaOfPlay"),
        steamApiKey: body.get("steamApiKey"),
        towWhitelisted: body.get("towWhitelisted"),
        whitelisted: body.get("whitelisted"),
        businessWhitelisted: body.get("businessWhitelisted"),
        registrationCode: body.get("registrationCode"),
        discordWebhookURL: body.get("discordWebhookURL"),
        miscCadSettings: {
          update: {
            roleplayEnabled: Boolean(body.get("roleplayEnabled")),
          },
        },
      },
    });

    this.socket.emitUpdateAop(updated.areaOfPlay);
    this.socket.emitUpdateRoleplayStopped(Boolean(body.get("roleplayEnabled")));

    return updated;
  }

  @UseBefore(IsAuth)
  @Put("/features")
  async updateDisabledFeatures(@Context() ctx: Context, @BodyParams() body: JsonRequestBody) {
    const error = validate(DISABLED_FEATURES_SCHEMA, body.toJSON(), true);
    if (error) {
      throw new BadRequest(error);
    }

    const updated = await prisma.cad.update({
      where: {
        id: ctx.get("cad").id,
      },
      data: {
        disabledFeatures: body.get("features"),
      },
    });

    return updated;
  }

  @UseBefore(IsAuth)
  @Put("/misc")
  async updateMiscSettings(@Context() ctx: Context, @BodyParams() body: JsonRequestBody) {
    const error = validate(CAD_MISC_SETTINGS_SCHEMA, body.toJSON(), true);
    if (error) {
      throw new BadRequest(error);
    }

    const updated = await prisma.miscCadSettings.update({
      where: {
        id: ctx.get("cad")?.miscCadSettings?.id,
      },
      data: {
        heightPrefix: body.get("heightPrefix"),
        weightPrefix: body.get("weightPrefix"),
        maxBusinessesPerCitizen: body.get("maxBusinessesPerCitizen"),
        maxCitizensPerUser: body.get("maxCitizensPerUser"),
        maxPlateLength: body.get("maxPlateLength"),
        pairedUnitSymbol: body.get("pairedUnitSymbol"),
        callsignTemplate: body.get("callsignTemplate"),
        liveMapURL: body.get("liveMapURL"),
        authScreenBgImageId: body.get("authScreenBgImageId"),
        authScreenHeaderImageId: body.get("authScreenHeaderImageId"),
      },
    });

    return updated;
  }

  @UseBefore(IsAuth)
  @Put("/api-token")
  async updateApiToken(@Context() ctx: Context, @BodyParams() body: JsonRequestBody) {
    const cad = ctx.get("cad");

    const existing =
      cad.apiTokenId &&
      (await prisma.apiToken.findFirst({
        where: {
          id: cad.apiTokenId,
        },
      }));

    if (existing) {
      const updated = await prisma.apiToken.update({
        where: {
          id: existing.id,
        },
        data: {
          enabled: body.get("enabled"),
        },
      });

      return updated;
    }

    const apiToken = await prisma.apiToken.create({
      data: {
        cad: { connect: { id: cad.id } },
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
