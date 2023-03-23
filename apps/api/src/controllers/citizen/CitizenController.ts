import { UseBeforeEach, Context, MultipartFile, PlatformMulterFile } from "@tsed/common";
import { Controller } from "@tsed/di";
import { ContentType, Delete, Description, Get, Post, Put } from "@tsed/schema";
import { QueryParams, BodyParams, PathParams } from "@tsed/platform-params";
import { prisma } from "lib/data/prisma";
import { IsAuth } from "middlewares/is-auth";
import { BadRequest, Forbidden, NotFound } from "@tsed/exceptions";
import { CREATE_CITIZEN_SCHEMA, CREATE_OFFICER_SCHEMA } from "@snailycad/schemas";
import fs from "node:fs/promises";
import { AllowedFileExtension, allowedFileExtensions } from "@snailycad/config";
import { generateString } from "utils/generate-string";
import { User, ValueType, Feature, cad, MiscCadSettings, Prisma } from "@prisma/client";
import { ExtendedBadRequest } from "src/exceptions/extended-bad-request";
import { canManageInvariant, userProperties } from "lib/auth/getSessionUser";
import { validateSchema } from "lib/data/validate-schema";
import { updateCitizenLicenseCategories } from "lib/citizen/licenses";
import { isFeatureEnabled } from "lib/cad";
import { shouldCheckCitizenUserId } from "lib/citizen/hasCitizenAccess";
import { citizenObjectFromData } from "lib/citizen";
import type * as APITypes from "@snailycad/types/api";
import { getImageWebPPath } from "lib/images/get-image-webp-path";
import { validateSocialSecurityNumber } from "lib/citizen/validateSSN";
import { setEndedSuspendedLicenses } from "lib/citizen/setEndedSuspendedLicenses";
import { upsertOfficer } from "controllers/leo/my-officers/upsert-officer";
import { createCitizenViolations } from "lib/records/create-citizen-violations";
import generateBlurPlaceholder from "lib/images/generate-image-blur-data";
import { z } from "zod";
import { RecordsInclude } from "controllers/leo/search/SearchController";
import { leoProperties } from "lib/leo/activeOfficer";

export const citizenInclude = {
  user: { select: userProperties },
  flags: true,
  suspendedLicenses: true,
  vehicles: {
    orderBy: { createdAt: "desc" },
    include: {
      trimLevels: true,
      flags: true,
      model: { include: { trimLevels: true, value: true } },
      registrationStatus: true,
      insuranceStatus: true,
      TruckLog: true,
      Business: true,
    },
    where: {
      // hide business vehicles
      Business: { every: { id: "null" } },
    },
    take: 12,
    skip: 0,
  },
  weapons: {
    orderBy: { createdAt: "desc" },
    take: 12,
    skip: 0,
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
} as const;

export const citizenIncludeWithRecords = {
  ...citizenInclude,
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
@ContentType("application/json")
export class CitizenController {
  @Get("/")
  @Description("Get all the citizens of the authenticated user")
  async getCitizens(
    @Context("cad") cad: { features?: Record<Feature, boolean> },
    @Context("user") user: User,
    @QueryParams("query", String) query = "",
    @QueryParams("skip", Number) skip = 0,
  ): Promise<APITypes.GetCitizensData> {
    const checkCitizenUserId = shouldCheckCitizenUserId({ cad, user });
    const [name, surname] = query.toString().toLowerCase().split(/ +/g);

    const where: Prisma.CitizenWhereInput = {
      userId: checkCitizenUserId ? user.id : undefined,
      OR: [
        {
          name: { contains: name, mode: "insensitive" },
          surname: { contains: surname, mode: "insensitive" },
        },
        {
          name: { contains: surname, mode: "insensitive" },
          surname: { contains: name, mode: "insensitive" },
        },
        { socialSecurityNumber: { contains: name, mode: "insensitive" } },
        { phoneNumber: { contains: name, mode: "insensitive" } },
      ],
    };

    const [citizensCount, citizens] = await prisma.$transaction([
      prisma.citizen.count({ where }),
      prisma.citizen.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        select: {
          name: true,
          surname: true,
          imageId: true,
          imageBlurData: true,
          id: true,
          userId: true,
          socialSecurityNumber: true,
          user: { select: userProperties },
        },
        skip,
        take: 35,
      }),
    ]);

    return { citizens, totalCount: citizensCount };
  }

  @Get("/:id")
  async getCitizen(
    @Context("cad") cad: { features?: Record<Feature, boolean>; miscCadSettings: MiscCadSettings },
    @Context("user") user: User,
    @PathParams("id") citizenId: string,
  ): Promise<APITypes.GetCitizenByIdData> {
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

    const [_citizen] = await setEndedSuspendedLicenses([citizen]);
    if (!_citizen) {
      throw new NotFound("notFound");
    }

    return _citizen;
  }

  @Get("/:id/records")
  async getCitizenRecords(
    @Context("cad") cad: { features?: Record<Feature, boolean>; miscCadSettings: MiscCadSettings },
    @Context("user") user: User,
    @PathParams("id") citizenId: string,
  ): Promise<APITypes.GetCitizenByIdRecordsData> {
    const checkCitizenUserId = shouldCheckCitizenUserId({ cad, user });

    const citizen = await prisma.citizen.findFirst({
      where: {
        id: citizenId,
        userId: checkCitizenUserId ? user.id : undefined,
      },
      include: citizenIncludeWithRecords,
    });

    if (!citizen) {
      throw new NotFound("notFound");
    }

    const isEnabled = isFeatureEnabled({
      feature: Feature.CITIZEN_RECORD_APPROVAL,
      features: cad.features,
      defaultReturn: false,
    });

    const records = await prisma.record.findMany({
      ...RecordsInclude(isEnabled),
      where: { ...RecordsInclude(isEnabled).where, citizenId: citizen.id },
    });
    return records;
  }

  @Delete("/:id")
  async deleteCitizen(
    @Context("user") user: User,
    @Context("cad") cad: cad & { features?: Record<Feature, boolean> },
    @PathParams("id") citizenId: string,
  ): Promise<APITypes.DeleteCitizenByIdData> {
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

  @Post("/:id/deceased")
  async markCitizenDeceased(
    @Context("user") user: User,
    @Context("cad") cad: cad & { features?: Record<Feature, boolean> },
    @PathParams("id") citizenId: string,
  ): Promise<APITypes.DeleteCitizenByIdData> {
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

    await prisma.citizen.update({
      where: { id: citizen.id },
      data: { dead: true, dateOfDead: new Date() },
    });

    return true;
  }

  @Post("/")
  async createCitizen(
    @Context("cad")
    cad: cad & { features?: Record<Feature, boolean>; miscCadSettings: MiscCadSettings },
    @Context("user") user: User,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PostCitizensData> {
    const data = validateSchema(
      CREATE_CITIZEN_SCHEMA.extend({
        department: z.string().nullish(),
      }),
      body,
    );

    const miscSettings = cad.miscCadSettings;
    if (miscSettings.maxCitizensPerUser) {
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
        throw new ExtendedBadRequest({ name: "nameAlreadyTaken" }, "nameAlreadyTaken");
      }
    }

    const date = new Date(data.dateOfBirth).getTime();
    const now = Date.now();

    if (date > now) {
      throw new ExtendedBadRequest({ dateOfBirth: "dateLargerThanNow" }, "dateLargerThanNow");
    }

    const defaultLicenseValue = await prisma.value.findFirst({
      where: { isDefault: true, type: ValueType.LICENSE },
    });
    const defaultLicenseValueId = defaultLicenseValue?.id ?? null;

    if (data.socialSecurityNumber) {
      await validateSocialSecurityNumber({
        socialSecurityNumber: data.socialSecurityNumber,
      });
    }

    const citizen = await prisma.citizen.create({
      data: {
        userId: user.id || undefined,
        ...(await citizenObjectFromData({
          data,
          defaultLicenseValueId,
          cad,
        })),
      },
      include: { suspendedLicenses: true },
    });

    await updateCitizenLicenseCategories(citizen, data);

    if (data.records) {
      await createCitizenViolations({
        cad,
        data: data.records,
        citizenId: citizen.id,
      });
    }

    if (data.department) {
      await upsertOfficer({
        body,
        citizen,
        cad,
        user,
        schema: CREATE_OFFICER_SCHEMA.omit({ citizenId: true, image: true }),
        includeProperties: false,
      });
    }

    return citizen;
  }

  @Put("/:id")
  async updateCitizen(
    @PathParams("id") citizenId: string,
    @Context("user") user: User,
    @Context("cad")
    cad: cad & { features?: Record<Feature, boolean>; miscCadSettings: MiscCadSettings | null },
    @BodyParams() body: unknown,
  ): Promise<APITypes.PutCitizenByIdData> {
    const data = validateSchema(CREATE_CITIZEN_SCHEMA.partial(), body);
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

    const date = data.dateOfBirth ? new Date(data.dateOfBirth).getTime() : undefined;
    if (date) {
      const now = Date.now();

      if (date > now) {
        throw new ExtendedBadRequest({ dateOfBirth: "dateLargerThanNow" });
      }
    }

    const isEditableSSNEnabled = isFeatureEnabled({
      features: cad.features,
      feature: Feature.EDITABLE_SSN,
      defaultReturn: true,
    });

    if (data.socialSecurityNumber && isEditableSSNEnabled) {
      await validateSocialSecurityNumber({
        socialSecurityNumber: data.socialSecurityNumber,
        citizenId: citizen.id,
      });
    }

    const updated = await prisma.citizen.update({
      where: {
        id: citizen.id,
      },
      data: {
        ...(await citizenObjectFromData({
          data,
          cad,
        })),
        socialSecurityNumber:
          data.socialSecurityNumber && isEditableSSNEnabled
            ? data.socialSecurityNumber
            : !citizen.socialSecurityNumber
            ? generateString(9, { type: "numbers-only" })
            : undefined,
      },
      include: { gender: true, ethnicity: true },
    });

    return updated;
  }

  @Post("/:id")
  async uploadImageToCitizen(
    @Context("user") user: User,
    @Context("cad") cad: cad & { features?: Record<Feature, boolean> },
    @PathParams("id") citizenId: string,
    @MultipartFile("image") file?: PlatformMulterFile,
  ): Promise<APITypes.PostCitizenImageByIdData> {
    try {
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

      if (!file) {
        throw new ExtendedBadRequest({ file: "No file provided." }, "invalidImageType");
      }

      if (!allowedFileExtensions.includes(file.mimetype as AllowedFileExtension)) {
        throw new ExtendedBadRequest({ image: "invalidImageType" }, "invalidImageType");
      }

      const image = await getImageWebPPath({
        buffer: file.buffer,
        pathType: "citizens",
        id: `${citizen.id}-${file.originalname.split(".")[0]}`,
      });

      const previousImage = citizen.imageId
        ? `${process.cwd()}/public/citizens/${citizen.imageId}`
        : undefined;

      if (previousImage) {
        await fs.rm(previousImage, { force: true });
      }

      const [data] = await Promise.all([
        prisma.citizen.update({
          where: { id: citizen.id },
          data: { imageId: image.fileName, imageBlurData: await generateBlurPlaceholder(image) },
          select: { imageId: true },
        }),
        fs.writeFile(image.path, image.buffer),
      ]);

      return data;
    } catch {
      throw new BadRequest("errorUploadingImage");
    }
  }
}
