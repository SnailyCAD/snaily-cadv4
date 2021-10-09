import { User } from ".prisma/client";
import { validate, LICENSE_SCHEMA } from "@snailycad/schemas";
import { UseBeforeEach, Context, BodyParams, PathParams } from "@tsed/common";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { JsonRequestBody, Put } from "@tsed/schema";
import { prisma } from "../../lib/prisma";
import { IsAuth } from "../../middlewares/IsAuth";

@Controller("/licenses")
@UseBeforeEach(IsAuth)
export class LicensesController {
  @Put("/:id")
  async updateCitizenLicenses(
    @PathParams("id") citizenId: string,
    @Context() ctx: Context,
    @BodyParams() body: JsonRequestBody,
  ) {
    const error = validate(LICENSE_SCHEMA, body.toJSON(), true);
    const user = ctx.get("user") as User;

    if (error) {
      return new BadRequest(error);
    }

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: citizenId,
      },
    });

    if (!citizen || citizen.userId !== user.id) {
      throw new NotFound("notFound");
    }

    const updated = await prisma.citizen.update({
      where: {
        id: citizen.id,
      },
      data: {
        ccw: body.get("ccw"),
        driversLicense: body.get("driversLicense"),
        pilotLicense: body.get("pilotLicense"),
        weaponLicense: body.get("weaponLicense"),
      },
    });

    return updated;
  }
}
