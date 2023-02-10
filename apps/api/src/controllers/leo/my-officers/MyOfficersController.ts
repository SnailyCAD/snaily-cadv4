import fs from "node:fs/promises";
import { Controller, UseBeforeEach, PlatformMulterFile, MultipartFile } from "@tsed/common";
import { ContentType, Delete, Description, Get, Post, Put } from "@tsed/schema";
import { QueryParams, BodyParams, Context, PathParams } from "@tsed/platform-params";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "lib/data/prisma";
import { IsAuth } from "middlewares/is-auth";
import { Feature, cad, User, MiscCadSettings, Rank } from "@prisma/client";
import { Permissions, UsePermissions } from "middlewares/use-permissions";
import { leoProperties } from "lib/leo/activeOfficer";
import { AllowedFileExtension, allowedFileExtensions } from "@snailycad/config";
import { ExtendedBadRequest } from "src/exceptions/extended-bad-request";
import type * as APITypes from "@snailycad/types/api";
import { upsertOfficer } from "./upsert-officer";
import generateBlurPlaceholder from "lib/images/generate-image-blur-data";
import { hasPermission } from "@snailycad/permissions";
import { getImageWebPPath } from "lib/images/get-image-webp-path";

@Controller("/leo")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
export class MyOfficersController {
  @Get("/")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  @Description("Get all the current user's officers.")
  async getUserOfficers(@Context("user") user: User): Promise<APITypes.GetMyOfficersData> {
    const [totalCount, officers] = await prisma.$transaction([
      prisma.officer.count({ where: { userId: user.id } }),
      prisma.officer.findMany({
        where: { userId: user.id },
        include: {
          ...leoProperties,
          qualifications: { include: { qualification: { include: { value: true } } } },
        },
      }),
    ]);

    return { officers, totalCount };
  }

  @Post("/")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async createOfficer(
    @BodyParams() body: unknown,
    @Context("user") user: User,
    @Context("cad")
    cad: cad & { features?: Record<Feature, boolean>; miscCadSettings: MiscCadSettings },
  ): Promise<APITypes.PostMyOfficersData> {
    return upsertOfficer({ body, user, cad });
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
    @Context("cad")
    cad: cad & { features?: Record<Feature, boolean>; miscCadSettings: MiscCadSettings },
  ): Promise<APITypes.PutMyOfficerByIdData> {
    const existingOfficer = await prisma.officer.findFirst({
      where: {
        id: officerId,
        userId: user.id,
      },
      include: leoProperties,
    });

    const updatedOfficer = await upsertOfficer({ body, user, cad, existingOfficer });

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
    permissions: [
      Permissions.Leo,
      Permissions.ManageUnits,
      Permissions.ViewUnits,
      Permissions.DeleteUnits,
    ],
  })
  async getOfficerLogs(
    @Context("user") user: User,
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("includeAll", Boolean) includeAll = false,
    @QueryParams("officerId", String) officerId?: string,
    @QueryParams("isAdmin", Boolean) isAdmin = false,
  ): Promise<APITypes.GetMyOfficersLogsData> {
    const hasManageUnitsPermissions = hasPermission({
      permissionsToCheck: [Permissions.ManageUnits, Permissions.ViewUnits, Permissions.DeleteUnits],
      userToCheck: user,
      fallback: (u) => u.rank !== Rank.USER,
    });
    const userIdObj = hasManageUnitsPermissions && isAdmin ? {} : { userId: user.id };

    const where = { ...userIdObj, emsFdDeputyId: null, officerId: officerId || undefined };

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
    try {
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
        id: `${officer.id}-${file.originalname.split(".")[0]}`,
      });

      const previousImage = officer.imageId
        ? `${process.cwd()}/public/units/${officer.imageId}`
        : undefined;

      if (previousImage) {
        await fs.rm(previousImage, { force: true });
      }

      const [data] = await Promise.all([
        prisma.officer.update({
          where: { id: officer.id },
          data: {
            imageId: image.fileName,
            imageBlurData: await generateBlurPlaceholder(image),
          },
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

export async function validateMaxDivisionsPerUnit(
  arr: unknown[],
  cad: (cad & { miscCadSettings: MiscCadSettings }) | null,
) {
  const { maxDivisionsPerOfficer } = cad?.miscCadSettings ?? {};

  if (maxDivisionsPerOfficer && arr.length > maxDivisionsPerOfficer) {
    throw new ExtendedBadRequest({ divisions: "maxDivisionsReached" });
  }
}
