import {
  validate,
  CAD_MISC_SETTINGS_SCHEMA,
  CAD_SETTINGS_SCHEMA,
  DISABLED_FEATURES_SCHEMA,
} from "@snailycad/schemas";
import { Controller } from "@tsed/di";
import { BodyParams, Context } from "@tsed/platform-params";
import { Delete, Get, JsonRequestBody, Post, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { IsAuth, setDiscordAUth } from "middlewares/index";
import { BadRequest } from "@tsed/exceptions";
import { MultipartFile, PlatformMulterFile, UseBefore } from "@tsed/common";
import { Socket } from "services/SocketService";
import { nanoid } from "nanoid";
import { AllowedFileExtension, allowedFileExtensions } from "@snailycad/config";
import fs from "node:fs";

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
  @Post("/image")
  async uploadImageToCAD(
    @Context() ctx: Context,
    @MultipartFile("image") file: PlatformMulterFile,
  ) {
    const cad = ctx.get("cad");

    if (!allowedFileExtensions.includes(file.mimetype as AllowedFileExtension)) {
      throw new BadRequest("invalidImageType");
    }

    // "image/png" -> "png"
    const extension = file.mimetype.split("/")[file.mimetype.split("/").length - 1];
    const path = `${process.cwd()}/public/cad/${cad.id}.${extension}`;

    await fs.writeFileSync(path, file.buffer);

    const data = await prisma.cad.update({
      where: {
        id: cad.id,
      },
      data: {
        logoId: `${cad.id}.${extension}`,
      },
      select: {
        logoId: true,
      },
    });

    return data;
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
