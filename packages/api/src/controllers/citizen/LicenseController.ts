import type { User } from ".prisma/client";
import { LICENSE_SCHEMA } from "@snailycad/schemas";
import { UseBeforeEach, Context, BodyParams, PathParams } from "@tsed/common";
import { Controller } from "@tsed/di";
import { NotFound } from "@tsed/exceptions";
import { Description, Put } from "@tsed/schema";
import { canManageInvariant } from "lib/auth/user";
import { prisma } from "lib/prisma";
import { validateSchema } from "lib/validateSchema";
import { IsAuth } from "middlewares/IsAuth";
import { manyToManyHelper } from "utils/manyToMany";

@Controller("/licenses")
@UseBeforeEach(IsAuth)
export class LicensesController {
  @Put("/:id")
  @Description("Update the licenses of a citizen")
  async updateCitizenLicenses(
    @PathParams("id") citizenId: string,
    @Context() ctx: Context,
    @BodyParams() body: unknown,
  ) {
    const data = validateSchema(LICENSE_SCHEMA, body);
    const user = ctx.get("user") as User;

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: citizenId,
      },
      include: { dlCategory: true },
    });

    canManageInvariant(citizen?.userId, user, new NotFound("notFound"));

    await prisma.citizen.update({
      where: {
        id: citizen.id,
      },
      data: {
        ccwId: data.ccw,
        driversLicenseId: data.driversLicense,
        pilotLicenseId: data.pilotLicense,
        weaponLicenseId: data.weaponLicense,
      },
    });

    const newArr = [...(data.driversLicenseCategory ?? []), ...(data.pilotLicenseCategory ?? [])];
    const disconnectConnectArr = manyToManyHelper(
      citizen.dlCategory.map((v) => v.id),
      newArr,
    );

    await prisma.$transaction(
      disconnectConnectArr.map((v) =>
        prisma.citizen.update({ where: { id: citizen.id }, data: { dlCategory: v } }),
      ),
    );

    const updated = await prisma.citizen.findUnique({
      where: {
        id: citizen.id,
      },
      include: {
        weaponLicense: true,
        driversLicense: true,
        ccw: true,
        pilotLicense: true,
        dlCategory: { include: { value: true } },
      },
    });

    return updated;
  }
}
