import { UseBeforeEach, Context, MultipartFile, PlatformMulterFile } from "@tsed/common";
import { Controller } from "@tsed/di";
import { Delete, Get, JsonRequestBody, Post, Put } from "@tsed/schema";
import { BodyParams, PathParams } from "@tsed/platform-params";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { CREATE_CITIZEN_SCHEMA, validate } from "@snailycad/schemas";
import fs from "node:fs";
import { AllowedFileExtension, allowedFileExtensions } from "@snailycad/config";
import { Feature, cad, MiscCadSettings } from ".prisma/client";
import { unitProperties } from "lib/officer";

export const citizenInclude = {
  vehicles: {
    include: {
      model: { include: { value: true } },
      registrationStatus: true,
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
        include: unitProperties,
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
  async createCitizen(@Context() ctx: Context, @BodyParams() body: JsonRequestBody) {
    const error = validate(CREATE_CITIZEN_SCHEMA, body.toJSON(), true);

    if (error) {
      return new BadRequest(error);
    }

    const disabledFeatures = (ctx.get("cad") as cad).disabledFeatures;
    const miscSettings = ctx.get("cad")?.miscCadSettings as MiscCadSettings;
    if (miscSettings && miscSettings.maxCitizensPerUser) {
      const count = await prisma.citizen.count({
        where: {
          userId: ctx.get("user").id,
        },
      });

      if (count >= miscSettings.maxCitizensPerUser) {
        throw new BadRequest("maxCitizensPerUserReached");
      }
    }

    const {
      address,
      weight,
      height,
      hairColor,
      eyeColor,
      dateOfBirth,
      ethnicity,
      name,
      surname,
      gender,
      driversLicense,
      weaponLicense,
      pilotLicense,
      driversLicenseCategory,
      pilotLicenseCategory,
      ccw,
      phoneNumber,
      image,
    } = body.toJSON() as {
      [key: string]: any;
      driversLicenseCategory: string[];
      pilotLicenseCategory: string[];
    };

    const isEnabled = disabledFeatures.includes(Feature.ALLOW_DUPLICATE_CITIZEN_NAMES);
    if (isEnabled) {
      const existing = await prisma.citizen.findFirst({
        where: {
          name,
          surname,
        },
      });

      if (existing) {
        throw new BadRequest("nameAlreadyTaken");
      }
    }

    const date = new Date(dateOfBirth).getTime();
    const now = Date.now();

    if (date > now) {
      throw new BadRequest("dateLargerThanNow");
    }

    const citizen = await prisma.citizen.create({
      data: {
        userId: ctx.get("user").id,
        address,
        weight,
        height,
        hairColor,
        dateOfBirth,
        ethnicityId: ethnicity,
        name,
        surname,
        genderId: gender,
        eyeColor,
        driversLicenseId: driversLicense || undefined,
        weaponLicenseId: weaponLicense || undefined,
        pilotLicenseId: pilotLicense || undefined,
        ccwId: ccw || undefined,
        phoneNumber: phoneNumber || null,
        imageId: image || undefined,
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

    await linkDlCategories(citizen.id, driversLicenseCategory, pilotLicenseCategory);

    return citizen;
  }

  @Put("/:id")
  async updateCitizen(
    @PathParams("id") citizenId: string,
    @Context() ctx: Context,
    @BodyParams() body: JsonRequestBody,
  ) {
    const error = validate(CREATE_CITIZEN_SCHEMA, body.toJSON(), true);
    if (error) {
      return new BadRequest(error);
    }

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: citizenId,
      },
    });

    if (!citizen || citizen.userId !== ctx.get("user").id) {
      throw new NotFound("Not Found");
    }

    const {
      address,
      weight,
      height,
      hairColor,
      eyeColor,
      dateOfBirth,
      ethnicity,
      gender,
      phoneNumber,
      image,
    } = body.toJSON();

    const date = new Date(dateOfBirth).getTime();
    const now = Date.now();

    if (date > now) {
      throw new BadRequest("dateLargerThanNow");
    }

    const updated = await prisma.citizen.update({
      where: {
        id: citizen.id,
      },
      data: {
        address,
        weight,
        height,
        hairColor,
        dateOfBirth,
        ethnicityId: ethnicity,
        genderId: gender,
        eyeColor,
        phoneNumber: phoneNumber || null,
        imageId: image || undefined,
      },
      include: {
        gender: true,
        ethnicity: true,
      },
    });

    return updated;
  }

  @Post("/:id")
  async uploadImageToCitizen(
    @Context() ctx: Context,
    @PathParams("id") citizenId: string,
    @MultipartFile("image") file: PlatformMulterFile,
  ) {
    const citizen = await prisma.citizen.findUnique({
      where: {
        id: citizenId,
      },
    });

    if (!citizen || citizen.userId !== ctx.get("user").id) {
      throw new NotFound("Not Found");
    }

    if (!allowedFileExtensions.includes(file.mimetype as AllowedFileExtension)) {
      throw new BadRequest("invalidImageType");
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
  driversLicenseCategory: string[] = [],
  pilotLicenseCategory: string[] = [],
) {
  await Promise.all(
    [...driversLicenseCategory, ...pilotLicenseCategory].map(async (fullId) => {
      const [id] = fullId.split("-");

      await prisma.citizen.update({
        where: {
          id: citizenId,
        },
        data: {
          dlCategory: {
            connect: {
              id,
            },
          },
        },
      });
    }),
  );
}

export async function unlinkDlCategories(citizenId: string) {
  const citizen = await prisma.citizen.findUnique({
    where: {
      id: citizenId,
    },
    select: {
      dlCategory: true,
    },
  });

  await Promise.all([
    citizen!.dlCategory.map(async (v) => {
      await prisma.citizen.update({
        where: {
          id: citizenId,
        },
        data: {
          dlCategory: {
            disconnect: {
              id: v.id,
            },
          },
        },
      });
    }),
  ]);
}
