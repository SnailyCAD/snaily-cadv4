import type { User } from ".prisma/client";
import { LICENSE_SCHEMA } from "@snailycad/schemas";
import { UseBeforeEach, Context, BodyParams, PathParams } from "@tsed/common";
import { Controller } from "@tsed/di";
import { NotFound } from "@tsed/exceptions";
import { Put } from "@tsed/schema";
import { canManageInvariant } from "lib/auth";
import { prisma } from "lib/prisma";
import { validateSchema } from "lib/validateSchema";
import { IsAuth } from "middlewares/IsAuth";
import { linkDlCategories, unlinkDlCategories } from "./CitizenController";

@Controller("/licenses")
@UseBeforeEach(IsAuth)
export class LicensesController {
  @Put("/:id")
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

    await unlinkDlCategories(citizen);

    await prisma.citizen.update({
      where: {
        id: citizen.id,
      },
      data: {
        ccwId: data.ccw || undefined,
        driversLicenseId: data.driversLicense || undefined,
        pilotLicenseId: data.pilotLicense || undefined,
        weaponLicenseId: data.weaponLicense || undefined,
      },
    });

    await linkDlCategories(
      citizen.id,
      data.driversLicenseCategory ?? [],
      data.pilotLicenseCategory ?? [],
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
