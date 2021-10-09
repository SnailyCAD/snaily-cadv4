import { User } from ".prisma/client";
import { validate, WEAPON_SCHEMA } from "@snailycad/schemas";
import { UseBeforeEach, Context, BodyParams, PathParams } from "@tsed/common";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { JsonRequestBody, Post, Delete, Put } from "@tsed/schema";
import { prisma } from "../../lib/prisma";
import { IsAuth } from "../../middlewares/IsAuth";
import { generateString } from "../../utils/generateString";

@Controller("/weapons")
@UseBeforeEach(IsAuth)
export class WeaponController {
  @Post("/")
  async registerWeapon(@Context() ctx: Context, @BodyParams() body: JsonRequestBody) {
    const error = validate(WEAPON_SCHEMA, body.toJSON(), true);
    const user = ctx.get("user") as User;

    if (error) {
      return new BadRequest(error);
    }

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: body.get("citizenId"),
      },
    });

    if (!citizen || citizen.userId !== user.id) {
      throw new NotFound("Citizen not found");
    }

    const weapon = await prisma.weapon.create({
      data: {
        citizenId: citizen.id,
        model: body.get("model"),
        registrationStatus: body.get("registrationStatus"),
        serialNumber: generateString(10),
        userId: user.id,
      },
    });

    return weapon;
  }

  @Put("/:id")
  async updateWeapon(
    @Context() ctx: Context,
    @PathParams("id") weaponId: string,
    @BodyParams() body: JsonRequestBody,
  ) {
    const error = validate(WEAPON_SCHEMA, body.toJSON(), true);

    if (error) {
      return new BadRequest(error);
    }

    const weapon = await prisma.weapon.findUnique({
      where: {
        id: weaponId,
      },
    });

    if (!weapon || weapon.userId !== ctx.get("user").id) {
      throw new NotFound("Weapon not found");
    }

    const updated = await prisma.weapon.update({
      where: {
        id: weapon.id,
      },
      data: {
        model: body.get("model"),
        registrationStatus: body.get("registrationStatus"),
      },
    });

    return updated;
  }

  @Delete("/:id")
  async deleteWeapon(@Context() ctx: Context, @PathParams("id") weaponId: string) {
    const weapon = await prisma.weapon.findUnique({
      where: {
        id: weaponId,
      },
    });

    if (!weapon || weapon.userId !== ctx.get("user").id) {
      throw new NotFound("Weapon not found");
    }

    await prisma.weapon.delete({
      where: {
        id: weapon.id,
      },
    });

    return true;
  }
}
