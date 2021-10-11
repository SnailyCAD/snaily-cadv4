import { validate, CAD_SETTINGS_SCHEMA, DISABLED_FEATURES_SCHEMA } from "@snailycad/schemas";
import { Controller } from "@tsed/di";
import { BodyParams, Context } from "@tsed/platform-params";
import { Get, JsonRequestBody, Put } from "@tsed/schema";
import { prisma } from "../../../lib/prisma";
import { IsAuth, IsOwner } from "../../../middlewares";
import { BadRequest } from "@tsed/exceptions";
import { UseBefore } from "@tsed/common";

@Controller("/cad-settings")
export class ManageCitizensController {
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

    return { ...cad, registrationCode: !!cad!.registrationCode };
  }

  @UseBefore(IsAuth, IsOwner)
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
        registrationCode: body.get("registrationCode"),
      },
    });

    return updated;
  }

  @UseBefore(IsAuth, IsOwner)
  @Put("/features")
  async updateDisabledFeatures(@Context() ctx: Context, @BodyParams() body: JsonRequestBody) {
    const error = validate(DISABLED_FEATURES_SCHEMA, body.toJSON(), true);
    if (error) {
      throw new BadRequest(error);
    }

    console.log(ctx.get("cad"));

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
}
