import { CadFeature, Feature, User } from "@prisma/client";
import { LICENSE_SCHEMA } from "@snailycad/schemas";
import { UseBeforeEach, Context, BodyParams, PathParams } from "@tsed/common";
import { Controller } from "@tsed/di";
import { NotFound } from "@tsed/exceptions";
import { Description, Put } from "@tsed/schema";
import { canManageInvariant } from "lib/auth/user";
import { prisma } from "lib/prisma";
import { validateSchema } from "lib/validateSchema";
import { IsAuth } from "middlewares/IsAuth";
import { updateCitizenLicenseCategories } from "lib/citizen/licenses";
import { isFeatureEnabled } from "lib/cad";
import { shouldCheckCitizenUserId } from "lib/citizen/hasCitizenAccess";

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
    const cad = ctx.get("cad") as { features?: CadFeature[] };

    const isDLExamEnabled = isFeatureEnabled({
      features: cad.features,
      feature: Feature.DL_EXAMS,
      defaultReturn: false,
    });

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: citizenId,
      },
      include: { dlCategory: true },
    });

    const checkCitizenUserId = await shouldCheckCitizenUserId({ cad, user });
    if (checkCitizenUserId) {
      canManageInvariant(citizen?.userId, user, new NotFound("notFound"));
    } else if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    await updateCitizenLicenseCategories(citizen, data);

    const updated = await prisma.citizen.update({
      where: {
        id: citizen.id,
      },
      data: {
        driversLicenseId: isDLExamEnabled ? undefined : data.driversLicense,
        pilotLicenseId: data.pilotLicense,
        weaponLicenseId: data.weaponLicense,
        waterLicenseId: data.waterLicense,
      },
      include: {
        weaponLicense: true,
        driversLicense: true,
        pilotLicense: true,
        waterLicense: true,
        dlCategory: { include: { value: true } },
      },
    });

    return updated;
  }
}
