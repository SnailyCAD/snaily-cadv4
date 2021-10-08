import { User } from ".prisma/client";
import { validate, WEAPON_SCHEMA} from "@snailycad/schemas";
import { UseBeforeEach, Context, BodyParams } from "@tsed/common";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { JsonRequestBody, Post } from "@tsed/schema";
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
}
