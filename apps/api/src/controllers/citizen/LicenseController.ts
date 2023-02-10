import { cad, Feature, User } from "@prisma/client";
import { LICENSE_SCHEMA } from "@snailycad/schemas";
import { UseBeforeEach, Context, BodyParams, PathParams } from "@tsed/common";
import { Controller } from "@tsed/di";
import { Forbidden, NotFound } from "@tsed/exceptions";
import { ContentType, Description, Put } from "@tsed/schema";
import { canManageInvariant } from "lib/auth/getSessionUser";
import { prisma } from "lib/data/prisma";
import { validateSchema } from "lib/data/validate-schema";
import { IsAuth } from "middlewares/is-auth";
import { updateCitizenLicenseCategories } from "lib/citizen/licenses";
import { isFeatureEnabled } from "lib/cad";
import { shouldCheckCitizenUserId } from "lib/citizen/hasCitizenAccess";
import type * as APITypes from "@snailycad/types/api";
import { citizenInclude } from "./CitizenController";
import { IsFeatureEnabled } from "middlewares/is-enabled";

@Controller("/licenses")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
@IsFeatureEnabled({ feature: Feature.ALLOW_CITIZEN_UPDATE_LICENSE })
export class LicensesController {
  @Put("/:id")
  @Description("Update the licenses of a citizen")
  async updateCitizenLicenses(
    @PathParams("id") citizenId: string,
    @Context("user") user: User,
    @Context("cad") cad: cad & { features?: Record<Feature, boolean> },
    @BodyParams() body: unknown,
  ): Promise<APITypes.PutCitizenLicensesByIdData> {
    const data = validateSchema(LICENSE_SCHEMA, body);

    const isLicenseExamsEnabled = isFeatureEnabled({
      features: cad.features,
      feature: Feature.LICENSE_EXAMS,
      defaultReturn: false,
    });

    if (isLicenseExamsEnabled) {
      throw new Forbidden("citizenNotAllowedToEditLicenses");
    }

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: citizenId,
      },
      include: { dlCategory: true, suspendedLicenses: true },
    });

    const checkCitizenUserId = shouldCheckCitizenUserId({ cad, user });
    if (checkCitizenUserId) {
      canManageInvariant(citizen?.userId, user, new NotFound("notFound"));
    } else if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    await updateCitizenLicenseCategories(citizen, data);
    const suspendedLicenses = citizen.suspendedLicenses;

    const updated = await prisma.citizen.update({
      where: {
        id: citizen.id,
      },
      data: {
        driversLicenseId: suspendedLicenses?.driverLicense ? undefined : data.driversLicense,
        pilotLicenseId: suspendedLicenses?.pilotLicense ? undefined : data.pilotLicense,
        weaponLicenseId: suspendedLicenses?.firearmsLicense ? undefined : data.weaponLicense,
        waterLicenseId: suspendedLicenses?.waterLicense ? undefined : data.waterLicense,
      },
      include: citizenInclude,
    });

    return updated;
  }
}
