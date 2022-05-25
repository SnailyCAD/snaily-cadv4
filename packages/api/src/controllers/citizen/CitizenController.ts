import process from "node:process";
import { UseBeforeEach, Context, MultipartFile, PlatformMulterFile } from "@tsed/common";
import { Controller } from "@tsed/di";
import { Delete, Get, Post, Put } from "@tsed/schema";
import { BodyParams, PathParams } from "@tsed/platform-params";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { BadRequest, Forbidden, NotFound } from "@tsed/exceptions";
import { CREATE_CITIZEN_SCHEMA } from "@snailycad/schemas";
import fs from "node:fs";
import { AllowedFileExtension, allowedFileExtensions } from "@snailycad/config";
import { leoProperties } from "lib/leo/activeOfficer";
import { generateString } from "utils/generateString";
import { CadFeature, User, ValueType, Feature, cad, MiscCadSettings } from "@prisma/client";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";
import { canManageInvariant, userProperties } from "lib/auth/getSessionUser";
import { validateSchema } from "lib/validateSchema";
import { updateCitizenLicenseCategories } from "lib/citizen/licenses";
import { isFeatureEnabled } from "lib/cad";
import { shouldCheckCitizenUserId } from "lib/citizen/hasCitizenAccess";
import { citizenObjectFromData } from "lib/citizen";

export const citizenInclude = {
  user: { select: userProperties },
  flags: true,
  vehicles: {
    orderBy: { createdAt: "desc" },
    include: {
      flags: true,
      model: { include: { value: true } },
      registrationStatus: true,
      insuranceStatus: true,
      TruckLog: true,
      Business: true,
    },
    where: {
      // hide business vehicles
      Business: { every: { id: "null" } },
    },
  },
  weapons: {
    orderBy: { createdAt: "desc" },
    include: {
      model: { include: { value: true } },
      registrationStatus: true,
    },
  },
  medicalRecords: { include: { bloodGroup: true }, orderBy: { createdAt: "desc" } },
  ethnicity: true,
  gender: true,
  weaponLicense: true,
  driversLicense: true,
  pilotLicense: true,
  waterLicense: true,
  dlCategory: { include: { value: true } },
  Record: {
    include: {
      officer: {
        include: leoProperties,
      },
      violations: {
        include: {
          penalCode: true,
        },
      },
    },
  },
} as const;

@Controller("/citizen")
@UseBeforeEach(IsAuth)
export class CitizenController {
  @Get("/")
  async getCitizens(@Context("cad") cad: { features?: CadFeature[] }, @Context("user") user: User) {
    const checkCitizenUserId = shouldCheckCitizenUserId({ cad, user });

    const citizens = await prisma.citizen.findMany({
      where: {
        userId: checkCitizenUserId ? user.id : undefined,
      },
      orderBy: { createdAt: "desc" },
      include: { user: { select: userProperties } },
    });

    return citizens;
  }

  @Get("/:id")
  async getCitizen(
    @Context("cad") cad: { features?: CadFeature[]; miscCadSettings: MiscCadSettings },
    @Context("user") user: User,
    @PathParams("id") citizenId: string,
  ) {
    const checkCitizenUserId = shouldCheckCitizenUserId({ cad, user });

    const citizen = await prisma.citizen.findFirst({
      where: {
        id: citizenId,
        userId: checkCitizenUserId ? user.id : undefined,
      },
      include: citizenInclude,
    });

    if (!citizen) {
      throw new NotFound("notFound");
    }

    return citizen;
  }

  @Delete("/:id")
  async deleteCitizen(@Context() ctx: Context, @PathParams("id") citizenId: string) {
    const cad = ctx.get("cad") as cad & { features?: CadFeature[] };
    const user = ctx.get("user") as User;
    const checkCitizenUserId = shouldCheckCitizenUserId({ cad, user });

    const allowDeletion = isFeatureEnabled({
      features: cad.features,
      feature: Feature.ALLOW_CITIZEN_DELETION_BY_NON_ADMIN,
      defaultReturn: true,
    });

    if (!allowDeletion) {
      throw new Forbidden("onlyAdminsCanDeleteCitizens");
    }

    const citizen = await prisma.citizen.findFirst({
      where: {
        id: citizenId,
        userId: checkCitizenUserId ? user.id : undefined,
      },
    });

    if (!citizen) {
      throw new NotFound("notFound");
    }

    await prisma.citizen.delete({
      where: {
        id: citizen.id,
      },
    });

    return true;
  }

  @Post("/")
  async createCitizen(
    @Context("cad") cad: cad & { features?: CadFeature[]; miscCadSettings: MiscCadSettings | null },
    @Context("user") user: User,
    @BodyParams() body: unknown,
  ) {
    const data = validateSchema(CREATE_CITIZEN_SCHEMA, body);

    const miscSettings = cad.miscCadSettings;
    if (miscSettings?.maxCitizensPerUser) {
      const count = await prisma.citizen.count({
        where: {
          userId: user.id,
        },
      });

      if (count >= miscSettings.maxCitizensPerUser) {
        throw new BadRequest("maxCitizensPerUserReached");
      }
    }

    const allowDuplicateCitizenNames = isFeatureEnabled({
      features: cad.features,
      feature: Feature.ALLOW_DUPLICATE_CITIZEN_NAMES,
      defaultReturn: true,
    });

    if (!allowDuplicateCitizenNames) {
      const existing = await prisma.citizen.findFirst({
        where: {
          name: data.name,
          surname: data.surname,
        },
      });

      if (existing) {
        throw new ExtendedBadRequest({ name: "nameAlreadyTaken" });
      }
    }

    const date = new Date(data.dateOfBirth).getTime();
    const now = Date.now();

    if (date > now) {
      throw new ExtendedBadRequest({ dateOfBirth: "dateLargerThanNow" });
    }

    const defaultLicenseValue = await prisma.value.findFirst({
      where: { isDefault: true, type: ValueType.LICENSE },
    });
    const defaultLicenseValueId = defaultLicenseValue?.id ?? null;

    const citizen = await prisma.citizen.create({
      data: {
        userId: user.id || undefined,
        ...citizenObjectFromData(data, defaultLicenseValueId),
      },
    });

    await updateCitizenLicenseCategories(citizen, data);
    return citizen;
  }

  @Put("/:id")
  async updateCitizen(
    @PathParams("id") citizenId: string,
    @Context("user") user: User,
    @Context("cad") cad: { features?: CadFeature[]; miscCadSettings: MiscCadSettings },
    @BodyParams() body: unknown,
  ) {
    const data = validateSchema(CREATE_CITIZEN_SCHEMA, body);
    const checkCitizenUserId = shouldCheckCitizenUserId({ cad, user });

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: citizenId,
      },
    });

    if (checkCitizenUserId) {
      canManageInvariant(citizen?.userId, user, new NotFound("notFound"));
    } else if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    const date = new Date(data.dateOfBirth).getTime();
    const now = Date.now();

    if (date > now) {
      throw new ExtendedBadRequest({ dateOfBirth: "dateLargerThanNow" });
    }

    const updated = await prisma.citizen.update({
      where: {
        id: citizen.id,
      },
      data: {
        ...citizenObjectFromData(data),
        socialSecurityNumber:
          data.socialSecurityNumber ??
          (!citizen.socialSecurityNumber ? generateString(9, { numbersOnly: true }) : undefined),
      },
      include: { gender: true, ethnicity: true },
    });

    return updated;
  }

  @Post("/:id")
  async uploadImageToCitizen(
    @Context("user") user: User,
    @Context("cad") cad: cad & { features?: CadFeature[] },
    @PathParams("id") citizenId: string,
    @MultipartFile("image") file: PlatformMulterFile,
  ) {
    const citizen = await prisma.citizen.findUnique({
      where: {
        id: citizenId,
      },
    });

    const isCreateCitizenEnabled = isFeatureEnabled({
      defaultReturn: false,
      feature: Feature.CREATE_USER_CITIZEN_LEO,
      features: cad.features,
    });

    const checkCitizenUserId = shouldCheckCitizenUserId({ cad, user });
    if (checkCitizenUserId && !isCreateCitizenEnabled) {
      canManageInvariant(citizen?.userId, user, new NotFound("notFound"));
    } else if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    if (!allowedFileExtensions.includes(file.mimetype as AllowedFileExtension)) {
      throw new ExtendedBadRequest({ image: "invalidImageType" });
    }

    // "image/png" -> "png"
    const extension = file.mimetype.split("/")[file.mimetype.split("/").length - 1];
    const path = `${process.cwd()}/public/citizens/${citizen.id}.${extension}`;

    await fs.writeFileSync(path, file.buffer);

    const data = await prisma.citizen.update({
      where: {
        id: citizenId,
      },
      data: {
        imageId: `${citizen.id}.${extension}`,
      },
      select: {
        imageId: true,
      },
    });

    return data;
  }
}
