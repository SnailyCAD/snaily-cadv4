import fs from "node:fs/promises";
import { Controller, UseBeforeEach, PlatformMulterFile, MultipartFile } from "@tsed/common";
import { ContentType, Delete, Get, Post, Put } from "@tsed/schema";
import { CREATE_OFFICER_SCHEMA } from "@snailycad/schemas";
import { QueryParams, BodyParams, Context, PathParams } from "@tsed/platform-params";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { getImageWebPPath, validateImgurURL } from "utils/image";
import { User, MiscCadSettings, Feature, CadFeature } from "@prisma/client";
import { validateSchema } from "lib/validateSchema";
import { handleWhitelistStatus } from "lib/leo/handleWhitelistStatus";
import { getLastOfArray, manyToManyHelper } from "utils/manyToMany";
import { Permissions, UsePermissions } from "middlewares/UsePermissions";
import { updateOfficerDivisionsCallsigns, validateMaxDepartmentsEachPerUser } from "lib/leo/utils";
import { isFeatureEnabled } from "lib/cad";
import { validateDuplicateCallsigns } from "lib/leo/validateDuplicateCallsigns";
import { findNextAvailableIncremental } from "lib/leo/findNextAvailableIncremental";
import { shouldCheckCitizenUserId } from "lib/citizen/hasCitizenAccess";
import { leoProperties } from "lib/leo/activeOfficer";
import { AllowedFileExtension, allowedFileExtensions } from "@snailycad/config";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";
import type * as APITypes from "@snailycad/types/api";
import type { cad } from "@snailycad/types";

@Controller("/leo")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
export class MyOfficersController {
  @Get("/")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async getUserOfficers(@Context("user") user: User): Promise<APITypes.GetMyOfficersData> {
    const officers = await prisma.officer.findMany({
      where: { userId: user.id },
      include: {
        ...leoProperties,
        qualifications: { include: { qualification: { include: { value: true } } } },
      },
    });

    return { officers };
  }

  @Post("/")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async createOfficer(
    @BodyParams() body: unknown,
    @Context("user") user: User,
    @Context("cad") cad: cad & { features: CadFeature[]; miscCadSettings: MiscCadSettings },
  ): Promise<APITypes.PostMyOfficersData> {
    const data = validateSchema(CREATE_OFFICER_SCHEMA, body);

    const checkCitizenUserId = shouldCheckCitizenUserId({ cad, user });
    const citizen = await prisma.citizen.findFirst({
      where: {
        id: data.citizenId,
        userId: checkCitizenUserId ? user.id : undefined,
      },
    });

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    const divisionsEnabled = isFeatureEnabled({
      feature: Feature.DIVISIONS,
      defaultReturn: true,
      features: cad.features,
    });

    if (divisionsEnabled) {
      if (!data.divisions || data.divisions.length <= 0) {
        throw new ExtendedBadRequest({ divisions: "Must have at least 1 item" });
      }

      await validateMaxDivisionsPerUnit(data.divisions, cad);
      await validateMaxDepartmentsEachPerUser({
        departmentId: data.department,
        userId: user.id,
        cad,
        type: "officer",
      });
    }

    const officerCount = await prisma.officer.count({
      where: { userId: user.id },
    });

    if (
      cad.miscCadSettings.maxOfficersPerUser &&
      officerCount >= cad.miscCadSettings.maxOfficersPerUser
    ) {
      throw new BadRequest("maxLimitOfficersPerUserReached");
    }

    const isBadgeNumbersEnabled = isFeatureEnabled({
      feature: Feature.BADGE_NUMBERS,
      defaultReturn: true,
      features: cad.features,
    });

    const { defaultDepartment, department, whitelistStatusId } = await handleWhitelistStatus(
      data.department,
      null,
    );

    await validateDuplicateCallsigns({
      callsign1: data.callsign,
      callsign2: data.callsign2,
      type: "leo",
    });

    const incremental = await findNextAvailableIncremental({ type: "leo" });
    let officer: any = await prisma.officer.create({
      data: {
        callsign: data.callsign,
        callsign2: data.callsign2,
        userId: user.id,
        departmentId: defaultDepartment ? defaultDepartment.id : data.department,
        rankId:
          (defaultDepartment
            ? defaultDepartment.defaultOfficerRankId
            : department.defaultOfficerRankId) || undefined,
        badgeNumber: isBadgeNumbersEnabled ? data.badgeNumber : undefined,
        citizenId: citizen.id,
        imageId: validateImgurURL(data.image),
        whitelistStatusId,
        incremental,
      },
      include: leoProperties,
    });

    if (divisionsEnabled) {
      const disconnectConnectArr = manyToManyHelper([], data.divisions as string[]);

      await updateOfficerDivisionsCallsigns({
        officerId: officer.id,
        disconnectConnectArr,
        callsigns: data.callsigns,
      });

      officer = getLastOfArray(
        await prisma.$transaction(
          disconnectConnectArr.map((v, idx) =>
            prisma.officer.update({
              where: { id: officer.id },
              data: { divisions: v },
              include:
                idx + 1 === disconnectConnectArr.length
                  ? {
                      ...leoProperties,
                      qualifications: { include: { qualification: { include: { value: true } } } },
                    }
                  : undefined,
            }),
          ),
        ),
      );
    }

    return officer as APITypes.PostMyOfficersData;
  }

  @Put("/:id")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async updateOfficer(
    @PathParams("id") officerId: string,
    @BodyParams() body: unknown,
    @Context("user") user: User,
    @Context("cad") cad: cad & { miscCadSettings: MiscCadSettings },
  ): Promise<APITypes.PutMyOfficerByIdData> {
    const data = validateSchema(CREATE_OFFICER_SCHEMA, body);

    const divisionsEnabled = isFeatureEnabled({
      feature: Feature.DIVISIONS,
      defaultReturn: true,
      features: cad.features,
    });

    const officer = await prisma.officer.findFirst({
      where: {
        id: officerId,
        userId: user.id,
      },
      include: leoProperties,
    });

    if (!officer) {
      throw new NotFound("officerNotFound");
    }

    if (divisionsEnabled) {
      if (!data.divisions || data.divisions.length <= 0) {
        throw new ExtendedBadRequest({ divisions: "Must have at least 1 item" });
      }

      await validateMaxDivisionsPerUnit(data.divisions as string[], cad);
    }

    await validateDuplicateCallsigns({
      callsign1: data.callsign,
      callsign2: data.callsign2,
      type: "leo",
      unitId: officer.id,
    });
    await validateMaxDepartmentsEachPerUser({
      departmentId: data.department,
      userId: user.id,
      cad,
      type: "officer",
      unitId: officer.id,
    });

    const checkCitizenUserId = shouldCheckCitizenUserId({ cad, user });
    const citizen = await prisma.citizen.findFirst({
      where: {
        id: data.citizenId,
        userId: checkCitizenUserId ? user.id : undefined,
      },
    });

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    const { defaultDepartment, department, whitelistStatusId } = await handleWhitelistStatus(
      data.department,
      officer,
    );

    if (divisionsEnabled) {
      const disconnectConnectArr = manyToManyHelper(
        officer.divisions.map((v) => v.id),
        data.divisions as string[],
      );

      await prisma.$transaction(
        disconnectConnectArr.map((v) =>
          prisma.officer.update({ where: { id: officer.id }, data: { divisions: v } }),
        ),
      );

      await updateOfficerDivisionsCallsigns({
        officerId: officer.id,
        disconnectConnectArr,
        callsigns: data.callsigns,
      });
    }

    const isBadgeNumbersEnabled = isFeatureEnabled({
      feature: Feature.BADGE_NUMBERS,
      defaultReturn: true,
      features: cad.features,
    });

    const rank = officer.rankId
      ? undefined
      : (defaultDepartment
          ? defaultDepartment.defaultOfficerRankId
          : department.defaultOfficerRankId) || undefined;

    const incremental = officer.incremental
      ? undefined
      : await findNextAvailableIncremental({ type: "leo" });

    const updatedOfficer = await prisma.officer.update({
      where: {
        id: officer.id,
      },
      data: {
        callsign: data.callsign,
        callsign2: data.callsign2,
        badgeNumber: isBadgeNumbersEnabled ? data.badgeNumber : undefined,
        citizenId: citizen.id,
        imageId: validateImgurURL(data.image),
        departmentId: defaultDepartment ? defaultDepartment.id : data.department,
        rankId: rank,
        whitelistStatusId,
        incremental,
      },
      include: {
        ...leoProperties,
        qualifications: { include: { qualification: { include: { value: true } } } },
      },
    });

    return updatedOfficer;
  }

  @Delete("/:id")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async deleteOfficer(
    @PathParams("id") officerId: string,
    @Context("user") user: User,
  ): Promise<APITypes.DeleteMyOfficerByIdData> {
    const officer = await prisma.officer.findFirst({
      where: {
        userId: user.id,
        id: officerId,
      },
    });

    if (!officer) {
      throw new NotFound("officerNotFound");
    }

    await prisma.officer.delete({
      where: {
        id: officer.id,
      },
    });

    return true;
  }

  @Get("/logs")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo, Permissions.ViewUnits, Permissions.ManageUnits],
  })
  async getOfficerLogs(
    @Context("user") user: User,
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("includeAll", Boolean) includeAll = false,
    @QueryParams("officerId", String) officerId?: string,
  ): Promise<APITypes.GetMyOfficersLogsData> {
    const where = { userId: user.id, emsFdDeputyId: null, officerId: officerId || undefined };

    const [totalCount, logs] = await prisma.$transaction([
      prisma.officerLog.count({ where }),
      prisma.officerLog.findMany({
        take: includeAll ? undefined : 25,
        skip: includeAll ? undefined : skip,
        where,
        include: { officer: { include: leoProperties } },
        orderBy: { startedAt: "desc" },
      }),
    ]);

    return { totalCount, logs };
  }

  @Post("/image/:id")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async uploadImageToOfficer(
    @Context("user") user: User,
    @PathParams("id") officerId: string,
    @MultipartFile("image") file?: PlatformMulterFile,
  ): Promise<APITypes.PostMyOfficerByIdData> {
    const officer = await prisma.officer.findFirst({
      where: {
        userId: user.id,
        id: officerId,
      },
    });

    if (!officer) {
      throw new NotFound("Not Found");
    }

    if (!file) {
      throw new ExtendedBadRequest({ file: "No file provided." });
    }

    if (!allowedFileExtensions.includes(file.mimetype as AllowedFileExtension)) {
      throw new ExtendedBadRequest({ image: "invalidImageType" });
    }

    const image = await getImageWebPPath({
      buffer: file.buffer,
      pathType: "units",
      id: officer.id,
    });

    const [data] = await Promise.all([
      prisma.officer.update({
        where: { id: officer.id },
        data: { imageId: image.fileName },
        select: { imageId: true },
      }),
      fs.writeFile(image.path, image.buffer),
    ]);

    return data;
  }
}

export async function validateMaxDivisionsPerUnit(arr: unknown[], cad: cad | null) {
  const { maxDivisionsPerOfficer } = cad?.miscCadSettings ?? {};

  if (maxDivisionsPerOfficer && arr.length > maxDivisionsPerOfficer) {
    throw new ExtendedBadRequest({ divisions: "maxDivisionsReached" });
  }
}
