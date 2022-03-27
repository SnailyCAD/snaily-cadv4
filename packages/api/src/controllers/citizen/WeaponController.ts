import { User, CadFeature, Feature } from "@prisma/client";
import { WEAPON_SCHEMA } from "@snailycad/schemas";
import { UseBeforeEach, Context, BodyParams, PathParams } from "@tsed/common";
import { Controller } from "@tsed/di";
import { NotFound } from "@tsed/exceptions";
import { Post, Delete, Put, Description } from "@tsed/schema";
import { canManageInvariant } from "lib/auth/user";
import { prisma } from "lib/prisma";
import { validateSchema } from "lib/validateSchema";
import { IsAuth } from "middlewares/IsAuth";
import { generateString } from "utils/generateString";

@Controller("/weapons")
@UseBeforeEach(IsAuth)
export class WeaponController {
  @Post("/")
  @Description("Register a new weapon")
  async registerWeapon(@Context() ctx: Context, @BodyParams() body: unknown) {
    const data = validateSchema(WEAPON_SCHEMA, body);
    const user = ctx.get("user") as User;
    const cad = ctx.get("cad") as { features: CadFeature[] } | null;

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: data.citizenId,
      },
    });

    canManageInvariant(citizen?.userId, user, new NotFound("notFound"));

    const isCustomEnabled = cad?.features.some(
      (v) => v.feature === Feature.CUSTOM_TEXTFIELD_VALUES && v.isEnabled,
    );
    let modelId = data.model;

    if (isCustomEnabled) {
      const newModel = await prisma.weaponValue.create({
        data: {
          value: {
            create: {
              isDefault: false,
              type: "WEAPON",
              value: data.model,
            },
          },
        },
      });

      modelId = newModel.id;
    }

    const weapon = await prisma.weapon.create({
      data: {
        citizenId: citizen.id,
        registrationStatusId: data.registrationStatus as string,
        serialNumber: data.serialNumber || generateString(10),
        userId: user.id || undefined,
        modelId,
      },
      include: {
        model: { include: { value: true } },
        registrationStatus: true,
      },
    });

    return weapon;
  }

  @Put("/:id")
  @Description("Update a registered weapon")
  async updateWeapon(
    @Context("user") user: User,
    @PathParams("id") weaponId: string,
    @BodyParams() body: unknown,
  ) {
    const data = validateSchema(WEAPON_SCHEMA, body);

    const weapon = await prisma.weapon.findUnique({
      where: {
        id: weaponId,
      },
    });

    canManageInvariant(weapon?.userId, user, new NotFound("notFound"));

    const updated = await prisma.weapon.update({
      where: {
        id: weapon.id,
      },
      data: {
        modelId: data.model,
        registrationStatusId: data.registrationStatus as string,
        serialNumber: data.serialNumber || weapon.serialNumber,
      },
      include: {
        model: { include: { value: true } },
        registrationStatus: true,
      },
    });

    return updated;
  }

  @Delete("/:id")
  @Description("Delete a registered weapon")
  async deleteWeapon(@Context("user") user: User, @PathParams("id") weaponId: string) {
    const weapon = await prisma.weapon.findUnique({
      where: {
        id: weaponId,
      },
    });

    canManageInvariant(weapon?.userId, user, new NotFound("notFound"));

    await prisma.weapon.delete({
      where: {
        id: weapon.id,
      },
    });

    return true;
  }
}
