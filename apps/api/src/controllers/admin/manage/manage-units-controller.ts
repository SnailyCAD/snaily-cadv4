import { Feature, Rank, WhitelistStatus, cad, CadFeature, MiscCadSettings } from "@prisma/client";
import { UPDATE_UNIT_SCHEMA, UPDATE_UNIT_CALLSIGN_SCHEMA } from "@snailycad/schemas";
import {
  PathParams,
  BodyParams,
  Context,
  QueryParams,
  MultipartFile,
  PlatformMulterFile,
} from "@tsed/common";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { ContentType, Delete, Description, Get, Post, Put } from "@tsed/schema";
import { validateMaxDivisionsPerUnit } from "controllers/leo/my-officers/MyOfficersController";
import { combinedUnitProperties, leoProperties, unitProperties } from "lib/leo/activeOfficer";
import { findUnit } from "lib/leo/findUnit";
import { updateOfficerDivisionsCallsigns } from "lib/leo/utils";
import { validateDuplicateCallsigns } from "lib/leo/validateDuplicateCallsigns";
import { prisma } from "lib/prisma";
import { validateSchema } from "lib/validateSchema";
import { IsAuth } from "middlewares/IsAuth";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import { Socket } from "services/socket-service";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";
import { manyToManyHelper } from "utils/manyToMany";
import { isCuid } from "cuid";
import type * as APITypes from "@snailycad/types/api";
import { isFeatureEnabled } from "lib/cad";
import { AllowedFileExtension, allowedFileExtensions } from "@snailycad/config";
import { getImageWebPPath, validateImageURL } from "lib/images/validate-image-url";
import generateBlurPlaceholder from "lib/images/generate-image-blur-data";
import fs from "node:fs/promises";
import { AuditLogActionType, createAuditLogEntry } from "@snailycad/audit-logger/server";

const ACTIONS = ["SET_DEPARTMENT_DEFAULT", "SET_DEPARTMENT_NULL", "DELETE_UNIT"] as const;
type Action = typeof ACTIONS[number];

const SUSPEND_TYPE = ["suspend", "unsuspend"] as const;
type SuspendType = "suspend" | "unsuspend";

export const ACCEPT_DECLINE_TYPES = ["ACCEPT", "DECLINE"] as const;
export type AcceptDeclineType = typeof ACCEPT_DECLINE_TYPES[number];

@UseBeforeEach(IsAuth)
@Controller("/admin/manage/units")
@ContentType("application/json")
export class AdminManageUnitsController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/")
  @Description("Get all the units in the CAD")
  @UsePermissions({
    fallback: (u) => u.isSupervisor || u.rank !== Rank.USER,
    permissions: [
      Permissions.ViewUnits,
      Permissions.DeleteUnits,
      Permissions.ManageUnits,
      Permissions.ManageUnitCallsigns,
      Permissions.ManageAwardsAndQualifications,
    ],
  })
  async getUnits(
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("includeAll", Boolean) includeAll = false,
    @QueryParams("query", String) query = "",
    @QueryParams("pendingOnly", Boolean) pendingOnly = false,
    @QueryParams("departmentId", String) departmentId?: string,
  ): Promise<APITypes.GetManageUnitsData> {
    const [officerCount, _officers] = await prisma.$transaction([
      prisma.officer.count({
        where: this.createWhere({ departmentId, query, pendingOnly }, "OFFICER"),
      }),
      prisma.officer.findMany({
        take: includeAll ? undefined : 35,
        skip: includeAll ? undefined : skip,
        include: leoProperties,
        where: this.createWhere({ departmentId, query, pendingOnly }, "OFFICER"),
      }),
    ]);

    const [emsFdDeputiesCount, _emsFdDeputies] = await prisma.$transaction([
      prisma.emsFdDeputy.count({
        where: this.createWhere({ departmentId, query, pendingOnly }, "DEPUTY"),
      }),
      prisma.emsFdDeputy.findMany({
        take: includeAll ? undefined : 35,
        skip: includeAll ? undefined : skip,
        include: unitProperties,
        where: this.createWhere({ departmentId, query, pendingOnly }, "DEPUTY"),
      }),
    ]);

    const officers = _officers.map((o) => ({ ...o, type: "OFFICER" as const }));
    const emsFdDeputies = _emsFdDeputies.map((o) => ({ ...o, type: "DEPUTY" as const }));

    return {
      units: [...officers, ...emsFdDeputies],
      totalCount: officerCount + emsFdDeputiesCount,
    };
  }

  @Get("/:id")
  @Description(
    "Get a unit by the `id` or get all units from a user by the `discordId` or `steamId`",
  )
  @UsePermissions({
    fallback: (u) => u.isSupervisor || u.rank !== Rank.USER,
    permissions: [
      Permissions.ViewUnits,
      Permissions.DeleteUnits,
      Permissions.ManageUnits,
      Permissions.ManageAwardsAndQualifications,
    ],
  })
  async getUnit(@PathParams("id") id: string): Promise<APITypes.GetManageUnitByIdData> {
    const extraInclude = {
      qualifications: { include: { qualification: { include: { value: true } } } },
      logs: { take: 25, orderBy: { createdAt: "desc" } },
    } as const;

    const isUnitId = isCuid(id);

    if (isUnitId) {
      let unit: any = await prisma.officer.findUnique({
        where: { id },
        include: { ...leoProperties, ...extraInclude },
      });

      if (!unit) {
        unit = await prisma.emsFdDeputy.findUnique({
          where: { id },
          include: { ...unitProperties, ...extraInclude },
        });
      }

      if (!unit) {
        unit = await prisma.combinedLeoUnit.findUnique({
          where: { id },
          include: combinedUnitProperties,
        });
      }

      if (!unit) {
        throw new NotFound("unitNotFound");
      }

      return unit;
    }

    const where = {
      OR: [{ user: { discordId: id } }, { user: { steamId: id } }],
    };

    const [userOfficers, userDeputies, userCombinedUnits] = await prisma.$transaction([
      prisma.officer.findMany({
        where,
        include: { ...unitProperties, ...extraInclude },
      }),
      prisma.emsFdDeputy.findMany({
        where,
        include: { ...unitProperties, ...extraInclude },
      }),
      prisma.combinedLeoUnit.findMany({
        where: { officers: { some: where } },
        include: combinedUnitProperties,
      }),
    ]);

    return {
      userOfficers,
      userDeputies,
      userCombinedUnits,
    } as any;
  }

  @Put("/off-duty")
  @Description("Set specified units off-duty")
  @UsePermissions({
    fallback: (u) => u.isSupervisor || u.rank !== Rank.USER,
    permissions: [Permissions.ManageUnits],
  })
  async setSelectedOffDuty(
    @Context("sessionUserId") sessionUserId: string,
    @BodyParams("ids") ids: string[],
  ): Promise<APITypes.PutManageUnitsOffDutyData> {
    const updated = await Promise.all(
      ids.map(async (fullId) => {
        const [id, rawType] = fullId.split("-");
        const type = rawType === "OFFICER" ? "officer" : "emsFdDeputy";

        if (rawType === "OFFICER") {
          const log = await prisma.officerLog.findFirst({
            where: {
              endedAt: null,
              officerId: id,
            },
          });

          if (log) {
            await prisma.officerLog.update({
              where: { id: log.id },
              data: { endedAt: new Date() },
            });
          }
        }

        // @ts-expect-error ignore
        return prisma[type].update({
          where: { id },
          data: { statusId: null },
        });
      }),
    );

    await Promise.all([
      this.socket.emitUpdateOfficerStatus(),
      this.socket.emitUpdateDeputyStatus(),
    ]);

    await createAuditLogEntry({
      translationKey: "unitsSetOffDuty",
      action: { type: AuditLogActionType.UnitsSetOffDuty, new: ids },
      prisma,
      executorId: sessionUserId,
    });

    return updated;
  }

  @Put("/callsign/:unitId")
  @UsePermissions({
    fallback: (u) => u.isSupervisor || u.rank !== Rank.USER,
    permissions: [Permissions.ManageUnitCallsigns, Permissions.ManageUnits],
  })
  @Description("Update a unit's callsign by its id")
  async updateCallsignUnit(
    @PathParams("unitId") unitId: string,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PutManageUnitCallsignData> {
    const data = validateSchema(UPDATE_UNIT_CALLSIGN_SCHEMA.partial(), body);

    const { type, unit } = await findUnit(unitId);

    if (!unit || type === "combined") {
      throw new NotFound("unitNotFound");
    }

    const prismaNames = {
      "ems-fd": "emsFdDeputy",
      leo: "officer",
    } as const;
    const t = prismaNames[type];

    if (data.callsign && data.callsign2) {
      await validateDuplicateCallsigns({
        callsign1: data.callsign,
        callsign2: data.callsign2,
        unitId: unit.id,
        type,
      });
    }

    if (type === "leo") {
      await updateOfficerDivisionsCallsigns({
        officerId: unit.id,
        disconnectConnectArr: [],
        callsigns: data.callsigns,
      });
    }

    // @ts-expect-error ignore
    const updated = await prisma[t].update({
      where: { id: unit.id },
      data: {
        callsign2: data.callsign2,
        callsign: data.callsign,
      },
      include: type === "leo" ? leoProperties : unitProperties,
    });

    return updated;
  }

  @Put("/:id")
  @UsePermissions({
    fallback: (u) => u.isSupervisor || u.rank !== Rank.USER,
    permissions: [Permissions.ManageUnits],
  })
  @Description("Update a unit by its id")
  async updateUnit(
    @Context("sessionUserId") sessionUserId: string,
    @PathParams("id") id: string,
    @BodyParams() body: unknown,
    @Context("cad") cad: cad & { miscCadSettings: MiscCadSettings; features?: CadFeature[] },
  ): Promise<APITypes.PutManageUnitData> {
    const data = validateSchema(UPDATE_UNIT_SCHEMA.partial(), body);

    let type: "officer" | "emsFdDeputy" = "officer";
    let unit: any = await prisma.officer.findUnique({
      where: { id },
      include: leoProperties,
    });

    if (!unit) {
      type = "emsFdDeputy";
      unit = await prisma.emsFdDeputy.findUnique({
        where: { id },
        include: unitProperties,
      });
    }

    if (!unit) {
      throw new NotFound("unitNotFound");
    }

    const isBadgeNumbersEnabled = isFeatureEnabled({
      feature: Feature.BADGE_NUMBERS,
      defaultReturn: true,
      features: cad.features,
    });

    if (isBadgeNumbersEnabled && typeof data.badgeNumber !== "undefined" && !data.badgeNumber) {
      throw new ExtendedBadRequest({ badgeNumber: "Required" });
    }

    if (type === "officer") {
      const divisionsEnabled = isFeatureEnabled({
        feature: Feature.DIVISIONS,
        defaultReturn: true,
        features: cad.features,
      });

      if (divisionsEnabled && typeof data.divisions !== "undefined") {
        if (!data.divisions || data.divisions.length <= 0) {
          throw new ExtendedBadRequest({ divisions: "Must have at least 1 item" });
        }

        await validateMaxDivisionsPerUnit(data.divisions, cad);

        const disconnectConnectArr = manyToManyHelper(
          (unit.divisions as { id: string }[]).map((v) => v.id),
          data.divisions as string[],
        );

        await prisma.$transaction(
          disconnectConnectArr.map((v) =>
            prisma.officer.update({ where: { id: unit.id }, data: { divisions: v } }),
          ),
        );
      }
    }

    const validatedImageURL = validateImageURL(data.image);

    // @ts-expect-error ignore
    const updated = await prisma[type].update({
      where: { id: unit.id },
      data: {
        statusId: data.status,
        departmentId: data.department,
        divisionId: data.division,
        rankId: data.rank,
        position: data.position,
        suspended: data.suspended,
        callsign2: data.callsign2,
        callsign: data.callsign,
        badgeNumber: data.badgeNumber,
        imageId: validatedImageURL,
        imageBlurData: await generateBlurPlaceholder(validatedImageURL),
      },
      include: type === "officer" ? leoProperties : unitProperties,
    });

    await createAuditLogEntry({
      action: { type: AuditLogActionType.UnitUpdate, new: updated, previous: unit },
      prisma,
      executorId: sessionUserId,
    });

    return updated;
  }

  @Post("/:id/image")
  @Description("Update an image of an officer or EMS/FD deputy")
  async updateUnitImage(
    @PathParams("id") unitId: string,
    @MultipartFile("image") file?: PlatformMulterFile,
  ): Promise<APITypes.PostCitizenImageByIdData> {
    try {
      const { unit, type } = await findUnit(unitId);
      const prismaName = type === "leo" ? "officer" : "emsFdDeputy";

      if (!unit) {
        throw new NotFound("unitNotFound");
      }

      if ("pairedUnitTemplate" in unit) {
        throw new ExtendedBadRequest({ unit: "unitIsCombined" });
      }

      if (!file) {
        throw new ExtendedBadRequest({ file: "No file provided." }, "invalidImageType");
      }

      if (!allowedFileExtensions.includes(file.mimetype as AllowedFileExtension)) {
        throw new ExtendedBadRequest({ image: "invalidImageType" }, "invalidImageType");
      }

      const image = await getImageWebPPath({
        buffer: file.buffer,
        pathType: "units",
        id: `${unit.id}-${file.originalname.split(".")[0]}`,
      });

      const previousImage = unit.imageId
        ? `${process.cwd()}/public/units/${unit.imageId}`
        : undefined;

      if (previousImage) {
        await fs.rm(previousImage, { force: true });
      }

      const [data] = await Promise.all([
        // @ts-expect-error the method properties are the same
        prisma[prismaName].update({
          where: { id: unit.id },
          data: { imageId: image.fileName, imageBlurData: await generateBlurPlaceholder(image) },
          select: { imageId: true },
        }),
        fs.writeFile(image.path, image.buffer),
      ]);

      console.log({ data });

      return data;
    } catch {
      throw new BadRequest("errorUploadingImage");
    }
  }

  @Post("/departments/:unitId")
  @Description("Accept or decline a unit into a department")
  @UsePermissions({
    fallback: (u) => u.isSupervisor || u.rank !== Rank.USER,
    permissions: [Permissions.ManageUnits],
  })
  async acceptOrDeclineUnit(
    @PathParams("unitId") unitId: string,
    @BodyParams("action") action: Action | null,
    @BodyParams("type") type: AcceptDeclineType | null,
  ): Promise<APITypes.PostManageUnitAcceptDeclineDepartmentData> {
    if (action && !ACTIONS.includes(action)) {
      throw new ExtendedBadRequest({ action: "Invalid Action" });
    }

    if (!type || !ACCEPT_DECLINE_TYPES.includes(type)) {
      throw new BadRequest("invalidType");
    }

    let unitType: "leo" | "ems-fd" = "leo";
    let unit: any = await prisma.officer.findFirst({
      where: { id: unitId },
      include: leoProperties,
    });

    if (!unit) {
      unitType = "ems-fd";
      unit = await prisma.emsFdDeputy.findFirst({
        where: { id: unitId },
        include: unitProperties,
      });
    }

    if (!unit) {
      throw new NotFound("unitNotFound");
    }

    const prismaNames = {
      leo: "officer",
      "ems-fd": "emsFdDeputy",
    } as const;
    const prismaName = prismaNames[unitType];

    if (!unit.whitelistStatus || unit.whitelistStatus.status !== WhitelistStatus.PENDING) {
      throw new BadRequest("unitIsNotAwaiting");
    }

    if (unit.whitelistStatusId && type === "ACCEPT") {
      await prisma.leoWhitelistStatus.update({
        where: { id: unit.whitelistStatusId },
        data: { status: WhitelistStatus.ACCEPTED },
      });
    }

    if (type === "ACCEPT") {
      // @ts-expect-error function has the same properties
      const updated = await prisma[prismaName].update({
        where: { id: unitId },
        data: {
          departmentId: unit.whitelistStatus.departmentId,
          rankId: unit.whitelistStatus.department.defaultOfficerRankId ?? undefined,
        },
        include: unitType === "leo" ? leoProperties : unitProperties,
      });

      return updated;
    }

    switch (action) {
      case "DELETE_UNIT": {
        // @ts-expect-error function has the same properties
        const updated = await prisma[prismaName].delete({
          where: { id: unit.id },
          include: unitType === "leo" ? leoProperties : unitProperties,
        });

        return { ...updated, deleted: true };
      }
      case "SET_DEPARTMENT_NULL": {
        if (unit.whitelistStatusId) {
          await prisma.leoWhitelistStatus.update({
            where: { id: unit.whitelistStatusId },
            data: { status: WhitelistStatus.DECLINED },
          });
        }

        // @ts-expect-error function has the same properties
        const updated = await prisma[prismaName].update({
          where: { id: unit.id },
          data: { departmentId: null },
          include: unitType === "leo" ? leoProperties : unitProperties,
        });

        return updated;
      }
      case "SET_DEPARTMENT_DEFAULT": {
        const defaultDepartment = await prisma.departmentValue.findFirst({
          where: { isDefaultDepartment: true },
        });

        if (!defaultDepartment) {
          throw new ExtendedBadRequest({ action: "No default department found" });
        }

        if (unit.whitelistStatusId) {
          await prisma.leoWhitelistStatus.update({
            where: { id: unit.whitelistStatusId },
            data: { status: WhitelistStatus.DECLINED },
          });
        }

        // @ts-expect-error function has the same properties
        const updated = await prisma[prismaName].update({
          where: { id: unit.id },
          data: { departmentId: defaultDepartment.id },
          include: unitType === "leo" ? leoProperties : unitProperties,
        });

        return updated;
      }
      default:
        return null;
    }
  }

  @Post("/:unitId/qualifications")
  @UsePermissions({
    fallback: (u) => u.isSupervisor || u.rank !== Rank.USER,
    permissions: [Permissions.ManageUnits, Permissions.ManageAwardsAndQualifications],
  })
  async addUnitQualification(
    @PathParams("unitId") unitId: string,
    @BodyParams("qualificationId") qualificationId: string,
  ): Promise<APITypes.PostManageUnitAddQualificationData> {
    const unit = await findUnit(unitId);

    if (unit.type === "combined") {
      throw new BadRequest("Cannot add qualifications to combined units");
    }

    if (!unit.unit) {
      throw new NotFound("unitNotFound");
    }

    const types = {
      leo: "officerId",
      "ems-fd": "emsFdDeputyId",
    } as const;

    const qualificationValue = await prisma.qualificationValue.findUnique({
      where: { id: qualificationId },
    });

    if (!qualificationValue) {
      throw new NotFound("qualificationNotFound");
    }

    const t = types[unit.type];
    const qualification = await prisma.unitQualification.create({
      data: {
        [t]: unitId,
        qualificationId: qualificationValue.id,
      },
      include: {
        qualification: { include: { value: true, departments: { include: { value: true } } } },
      },
    });

    return qualification;
  }

  @Delete("/:unitId/qualifications/:qualificationId")
  @UsePermissions({
    fallback: (u) => u.isSupervisor || u.rank !== Rank.USER,
    permissions: [Permissions.ManageUnits, Permissions.ManageAwardsAndQualifications],
  })
  async deleteUnitQualification(
    @PathParams("unitId") unitId: string,
    @PathParams("qualificationId") qualificationId: string,
  ): Promise<APITypes.DeleteManageUnitQualificationData> {
    const unit = await findUnit(unitId);

    if (unit.type === "combined") {
      throw new BadRequest("Cannot add qualifications to combined units");
    }

    if (!unit.unit) {
      throw new NotFound("unitNotFound");
    }

    await prisma.unitQualification.delete({
      where: { id: qualificationId },
    });

    return true;
  }

  @Put("/:unitId/qualifications/:qualificationId")
  @UsePermissions({
    fallback: (u) => u.isSupervisor || u.rank !== Rank.USER,
    permissions: [Permissions.ManageUnits, Permissions.ManageAwardsAndQualifications],
  })
  async suspendOrUnsuspendUnitQualification(
    @PathParams("unitId") unitId: string,
    @PathParams("qualificationId") qualificationId: string,
    @BodyParams("type") suspendType: SuspendType,
  ): Promise<APITypes.PutManageUnitQualificationData> {
    if (!SUSPEND_TYPE.includes(suspendType)) {
      throw new BadRequest("invalidType");
    }

    const unit = await findUnit(unitId);

    if (unit.type === "combined") {
      throw new BadRequest("Cannot add qualifications to combined units");
    }

    if (!unit.unit) {
      throw new NotFound("unitNotFound");
    }

    const qualification = await prisma.unitQualification.findUnique({
      where: { id: qualificationId },
    });

    if (!qualification) {
      throw new NotFound("qualificationNotFound");
    }

    const updated = await prisma.unitQualification.update({
      where: { id: qualification.id },
      data: {
        suspendedAt: suspendType === "suspend" ? new Date() : null,
      },
      include: {
        qualification: { include: { value: true, departments: { include: { value: true } } } },
      },
    });

    return updated;
  }

  @Delete("/:unitId")
  @UsePermissions({
    fallback: (u) => u.isSupervisor || u.rank !== Rank.USER,
    permissions: [Permissions.DeleteUnits],
  })
  async deleteUnit(
    @Context("sessionUserId") sessionUserId: string,
    @PathParams("unitId") unitId: string,
  ): Promise<APITypes.DeleteManageUnitByIdData> {
    const unit = await findUnit(unitId);

    if (unit.type === "combined") {
      throw new BadRequest("Cannot delete combined units");
    }

    if (!unit.unit) {
      throw new NotFound("unitNotFound");
    }

    const types = {
      leo: "officer",
      "ems-fd": "emsFdDeputy",
    } as const;
    const t = types[unit.type];

    // @ts-expect-error properties are the same for this method.
    await prisma[t].delete({
      where: { id: unit.unit.id },
    });

    await createAuditLogEntry({
      translationKey: "deletedEntry",
      action: { type: AuditLogActionType.UnitDelete, new: unit.unit },
      prisma,
      executorId: sessionUserId,
    });

    return true;
  }

  private createWhere(
    {
      query,
      pendingOnly,
      departmentId,
    }: { departmentId?: string; query: string; pendingOnly: boolean },
    type: "OFFICER" | "DEPUTY" = "OFFICER",
  ) {
    const [name, surname] = query.toString().toLowerCase().split(/ +/g);

    const departmentIdWhere = departmentId ? { departmentId } : {};

    if (!query) {
      return pendingOnly
        ? {
            whitelistStatus: { status: WhitelistStatus.PENDING },
            ...departmentIdWhere,
          }
        : departmentIdWhere;
    }

    const where: any = {
      ...(pendingOnly ? { whitelistStatus: { status: WhitelistStatus.PENDING } } : {}),
      OR: [
        departmentIdWhere,
        { id: query },
        { callsign: query },
        { callsign2: query },
        { department: { value: { value: { contains: query, mode: "insensitive" } } } },
        { status: { value: { value: { contains: query, mode: "insensitive" } } } },
        {
          citizen: {
            OR: [
              {
                name: { contains: name, mode: "insensitive" },
                surname: { contains: surname, mode: "insensitive" },
              },
              {
                name: { contains: name, mode: "insensitive" },
                surname: { contains: surname, mode: "insensitive" },
              },
            ],
          },
        },
      ],
    };

    if (type === "OFFICER") {
      where.OR.push({
        divisions: { some: { value: { value: { contains: query, mode: "insensitive" } } } },
      });
    }

    return where;
  }
}
