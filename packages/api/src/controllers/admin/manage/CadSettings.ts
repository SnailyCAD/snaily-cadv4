import { validate } from "@snailycad/schemas";
import { Controller } from "@tsed/di";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { BodyParams, Context } from "@tsed/platform-params";
import { JsonRequestBody, Put } from "@tsed/schema";
import { prisma } from "../../../lib/prisma";
import { IsAuth, IsOwner } from "../../../middlewares";
import { CAD_SETTINGS_SCHEMA } from "@snailycad/schemas";
import { BadRequest } from "@tsed/exceptions";

@UseBeforeEach(IsAuth, IsOwner)
@Controller("/cad-settings")
export class ManageCitizensController {
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
      },
    });

    return updated;
  }
}
