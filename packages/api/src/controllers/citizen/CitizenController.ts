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
import { Feature, cad, MiscCadSettings } from ".prisma/client";
import { leoProperties } from "lib/leo/activeOfficer";
import { validateImgurURL } from "utils/image";
import { generateString } from "utils/generateString";
import { Citizen, DriversLicenseCategoryValue, User, ValueType } from "@prisma/client";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";
import { canManageInvariant, userProperties } from "lib/auth/user";
import { validateSchema } from "lib/validateSchema";

export const citizenInclude = {
  user: { select: userProperties },
  vehicles: {
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
    include: {
      model: { include: { value: true } },
      registrationStatus: true,
    },
  },
  medicalRecords: true,
  ethnicity: true,
  gender: true,
  weaponLicense: true,
  driversLicense: true,
  ccw: true,
  pilotLicense: true,
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
};

@Controller("/citizen")
@UseBeforeEach(IsAuth)
export class CitizenController {
  @Get("/")
  async getCitizens(@Context() ctx: Context) {
    const citizens = await prisma.citizen.findMany({
      where: {
        userId: ctx.get("user").id,
      },
    });

    return citizens;
  }

  @Get("/:id")
  async getCitizen(@Context() ctx: Context, @PathParams("id") citizenId: string) {
    const citizen = await prisma.citizen.findFirst({
      where: {
        id: citizenId,
        userId: ctx.get("user").id,
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
    const cad = ctx.get("cad") as cad;
    const disallowDeletion = cad.disabledFeatures.includes(
      Feature.ALLOW_CITIZEN_DELETION_BY_NON_ADMIN,
    );

    if (disallowDeletion) {
      throw new Forbidden("onlyAdminsCanDeleteCitizens");
    }

    const citizen = await prisma.citizen.findFirst({
      where: {
        id: citizenId,
        userId: ctx.get("user").id,
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
    @Context("cad") cad: cad & { miscCadSettings: MiscCadSettings | null },
    @Context("user") user: User,
    @BodyParams() body: unknown,
  ) {
    const data = validateSchema(CREATE_CITIZEN_SCHEMA, body);

    const disabledFeatures = cad.disabledFeatures;
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

    const doNotAllowDuplicateCitizenNames = disabledFeatures.includes(
      Feature.ALLOW_DUPLICATE_CITIZEN_NAMES,
    );

    if (doNotAllowDuplicateCitizenNames) {
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
        address: data.address,
        postal: data.postal || null,
        weight: data.weight,
        height: data.height,
        hairColor: data.hairColor,
        dateOfBirth: data.dateOfBirth,
        ethnicityId: data.ethnicity,
        name: data.name,
        surname: data.surname,
        genderId: data.gender,
        eyeColor: data.eyeColor,
        driversLicenseId: data.driversLicense || defaultLicenseValueId,
        weaponLicenseId: data.weaponLicense || defaultLicenseValueId,
        pilotLicenseId: data.pilotLicense || defaultLicenseValueId,
        ccwId: data.ccw || defaultLicenseValueId,
        phoneNumber: data.phoneNumber || null,
        imageId: validateImgurURL(data.image),
        socialSecurityNumber: generateString(9, { numbersOnly: true }),
        occupation: data.occupation || null,
      },
      include: {
        gender: true,
        ethnicity: true,
        weaponLicense: true,
        driversLicense: true,
        ccw: true,
        pilotLicense: true,
      },
    });

    await linkDlCategories(
      citizen.id,
      data.driversLicenseCategory ?? [],
      data.pilotLicenseCategory ?? [],
    );

    return citizen;
  }

  @Put("/:id")
  async updateCitizen(
    @PathParams("id") citizenId: string,
    @Context("user") user: User,
    @BodyParams() body: unknown,
  ) {
    const data = validateSchema(CREATE_CITIZEN_SCHEMA, body);

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: citizenId,
      },
    });

    canManageInvariant(citizen?.userId, user, new NotFound("notFound"));

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
        address: data.address,
        postal: data.postal || null,
        weight: data.weight,
        height: data.height,
        hairColor: data.hairColor,
        dateOfBirth: data.dateOfBirth,
        ethnicityId: data.ethnicity,
        genderId: data.gender,
        eyeColor: data.eyeColor,
        phoneNumber: data.phoneNumber,
        occupation: data.occupation,
        imageId: validateImgurURL(data.image),
        socialSecurityNumber: !citizen.socialSecurityNumber
          ? generateString(9, { numbersOnly: true })
          : undefined,
      },
      include: { gender: true, ethnicity: true },
    });

    return updated;
  }

  @Post("/:id")
  async uploadImageToCitizen(
    @Context("user") user: User,
    @PathParams("id") citizenId: string,
    @MultipartFile("image") file: PlatformMulterFile,
  ) {
    const citizen = await prisma.citizen.findUnique({
      where: {
        id: citizenId,
      },
    });

    if (!citizen || (user.rank === "USER" && citizen.userId !== user.id)) {
      throw new NotFound("Not Found");
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

export async function linkDlCategories(
  citizenId: string,
  driversLicenseCategory: string[],
  pilotLicenseCategory: string[],
) {
  await Promise.all(
    [...driversLicenseCategory, ...pilotLicenseCategory].map(async (fullId) => {
      const [id] = fullId.split("-");

      await prisma.citizen.update({
        where: { id: citizenId },
        data: { dlCategory: { connect: { id } } },
      });
    }),
  );
}

export async function unlinkDlCategories(
  citizen: Citizen & { dlCategory: DriversLicenseCategoryValue[] },
) {
  await Promise.all(
    citizen.dlCategory.map(async (v) => {
      await prisma.citizen.update({
        where: {
          id: citizen.id,
        },
        data: { dlCategory: { disconnect: { id: v.id } } },
      });
    }),
  );
}
