import { cad, Feature, User } from "@prisma/client";
import { LICENSE_SCHEMA } from "@snailycad/schemas";
import { canManageInvariant } from "lib/auth/getSessionUser";
import { prisma } from "lib/data/prisma";
import { validateSchema } from "lib/data/validate-schema";
import { updateCitizenLicenseCategories } from "lib/citizen/licenses/update-citizen-license-categories";
import { isFeatureEnabled } from "lib/upsert-cad";
import { shouldCheckCitizenUserId } from "lib/citizen/has-citizen-access";
import type * as APITypes from "@snailycad/types/api";
import { citizenInclude } from "./CitizenController";
import { IsFeatureEnabled } from "middlewares/is-enabled";
import {
  Body,
  Controller,
  ForbiddenException,
  NotFoundException,
  Param,
  Put,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "~/middlewares/auth/is-auth";
import { Description } from "~/decorators/description";
import { SessionUser } from "~/decorators/user";
import { Cad } from "~/decorators/cad";

@Controller("/licenses")
@UseGuards(AuthGuard)
@IsFeatureEnabled({ feature: Feature.ALLOW_CITIZEN_UPDATE_LICENSE })
export class LicensesController {
  @Put("/:id")
  @Description("Update the licenses of a citizen")
  async updateCitizenLicenses(
    @Param("id") citizenId: string,
    @SessionUser() user: User,
    @Cad() cad: cad & { features?: Record<Feature, boolean> },
    @Body() body: unknown,
  ): Promise<APITypes.PutCitizenLicensesByIdData> {
    const data = validateSchema(LICENSE_SCHEMA, body);

    const isLicenseExamsEnabled = isFeatureEnabled({
      features: cad.features,
      feature: Feature.LICENSE_EXAMS,
      defaultReturn: false,
    });

    if (isLicenseExamsEnabled) {
      throw new ForbiddenException("citizenNotAllowedToEditLicenses");
    }

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: citizenId,
      },
      include: { dlCategory: true, suspendedLicenses: true },
    });

    const checkCitizenUserId = shouldCheckCitizenUserId({ cad, user });
    if (checkCitizenUserId) {
      canManageInvariant(citizen?.userId, user, new NotFoundException("notFound"));
    } else if (!citizen) {
      throw new NotFoundException("citizenNotFound");
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
