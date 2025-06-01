/* eslint-disable unicorn/number-literal-case */
import {
  Feature,
  WhitelistStatus,
  type cad,
  type MiscCadSettings,
  DiscordWebhookType,
  type Officer,
} from "@prisma/client";
import { UPDATE_UNIT_SCHEMA, UPDATE_UNIT_CALLSIGN_SCHEMA } from "@snailycad/schemas";
import {
  PathParams,
  BodyParams,
  Context,
  QueryParams,
  MultipartFile,
  type PlatformMulterFile,
} from "@tsed/common";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { ContentType, Delete, Description, Get, Post, Put } from "@tsed/schema";
import { validateMaxDivisionsPerUnit } from "controllers/leo/my-officers/MyOfficersController";
import { findUnit } from "lib/leo/findUnit";
import { updateOfficerDivisionsCallsigns } from "lib/leo/utils";
import { validateDuplicateCallsigns } from "lib/leo/validateDuplicateCallsigns";
import { prisma } from "lib/data/prisma";
import { validateSchema } from "lib/data/validate-schema";
import { IsAuth } from "middlewares/auth/is-auth";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import { Socket } from "services/socket-service";
import { ExtendedBadRequest } from "~/exceptions/extended-bad-request";
import { manyToManyHelper } from "lib/data/many-to-many";
import type * as APITypes from "@snailycad/types/api";
import { isFeatureEnabled } from "lib/upsert-cad";
import { type AllowedFileExtension, allowedFileExtensions } from "@snailycad/config";
import { validateImageURL } from "lib/images/validate-image-url";
import generateBlurPlaceholder from "lib/images/generate-image-blur-data";
import fs from "node:fs/promises";
import { AuditLogActionType, createAuditLogEntry } from "@snailycad/audit-logger/server";
import { getImageWebPPath } from "lib/images/get-image-webp-path";
import { createWhere } from "controllers/leo/create-where-obj";
import {
  leoProperties,
  unitProperties,
  _leoProperties,
  combinedUnitProperties,
  combinedEmsFdUnitProperties,
} from "utils/leo/includes";
import { getTranslator } from "~/utils/get-translator";
import { type APIEmbed } from "discord-api-types/v10";
import { sendRawWebhook, sendDiscordWebhook } from "~/lib/discord/webhooks";
import { type Citizen, type EmsFdDeputy, type LeoWhitelistStatus, User } from "@snailycad/types";
import { generateCallsign } from "@snailycad/utils";
import { hasPermission } from "@snailycad/permissions";

const ACTIONS = ["SET_DEPARTMENT_DEFAULT", "SET_DEPARTMENT_NULL", "DELETE_UNIT"] as const;
type Action = (typeof ACTIONS)[number];

const SUSPEND_TYPE = ["suspend", "unsuspend"] as const;
type SuspendType = "suspend" | "unsuspend";

export const ACCEPT_DECLINE_TYPES = ["ACCEPT", "DECLINE"] as const;
export type AcceptDeclineType = (typeof ACCEPT_DECLINE_TYPES)[number];

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
        where: createWhere({ departmentId, query, pendingOnly, type: "OFFICER" }),
      }),
      prisma.officer.findMany({
        take: includeAll ? undefined : 35,
        skip: includeAll ? undefined : skip,
        include: leoProperties,
        where: createWhere({ departmentId, query, pendingOnly, type: "OFFICER" }),
      }),
    ]);

    const [emsFdDeputiesCount, _emsFdDeputies] = await prisma.$transaction([
      prisma.emsFdDeputy.count({
        where: createWhere({ departmentId, query, pendingOnly, type: "DEPUTY" }),
      }),
      prisma.emsFdDeputy.findMany({
        take: includeAll ? undefined : 35,
        skip: includeAll ? undefined : skip,
        include: unitProperties,
        where: createWhere({ departmentId, query, pendingOnly, type: "DEPUTY" }),
      }),
    ]);

    const officers = _officers.map((o) => ({ ...o, type: "OFFICER" as const }));
    const emsFdDeputies = _emsFdDeputies.map((o) => ({ ...o, type: "DEPUTY" as const }));

    return {
      units: [...officers, ...emsFdDeputies],
      totalCount: officerCount + emsFdDeputiesCount,
    };
  }

  @Get("/prune")
  @UsePermissions({
    permissions: [Permissions.ManageUnits, Permissions.DeleteUnits],
  })
  @Description("Get inactive units by days and departmentId")
  async getInactiveUnits(
    @QueryParams("departmentId") departmentId: string | undefined = undefined,
    @QueryParams("days", Number) days = 2,
  ) {
    const where = {
      updatedAt: {
        lte: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * days),
      },
      departmentId,
    };

    const [officers, deputies] = await prisma.$transaction([
      prisma.officer.findMany({
        where,
        include: _leoProperties,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.emsFdDeputy.findMany({
        where,
        include: unitProperties,
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    const units = [...officers, ...deputies];

    return units;
  }

  @Delete("/prune")
  @UsePermissions({
    permissions: [Permissions.ManageUnits, Permissions.DeleteUnits],
  })
  async pruneInactiveUnits(
    @Context("sessionUserId") sessionUserId: string,
    @BodyParams("unitIds", String) unitIds: `${"OFFICER" | "EMS_FD"}-${string}`[],
    @BodyParams("days", Number) days = 30,
    @BodyParams("action", String) action = "SET_DEPARTMENT_DEFAULT",
  ) {
    const ALLOWED_ACTIONS = ["SET_DEPARTMENT_DEFAULT", "SET_DEPARTMENT_NULL", "DELETE_UNIT"];

    if (!ALLOWED_ACTIONS.includes(action)) {
      throw new ExtendedBadRequest({ action: "Invalid action" });
    }

    const defaultDepartment = await prisma.departmentValue.findFirst({
      where: { isDefaultDepartment: true },
    });

    if (!defaultDepartment && action === "SET_DEPARTMENT_DEFAULT") {
      throw new BadRequest("noDefaultDepartmentSet");
    }

    const arr = await prisma.$transaction(
      unitIds.map((id) => {
        const [type, unitId] = id.split("-");
        const prismaName = type === "OFFICER" ? "officer" : "emsFdDeputy";

        if (action === "SET_DEPARTMENT_NULL") {
          // @ts-expect-error method properties are the same
          return prisma[prismaName].updateMany({
            where: { id: unitId },
            data: { departmentId: null },
          });
        }

        if (action === "SET_DEPARTMENT_DEFAULT") {
          // @ts-expect-error method properties are the same
          return prisma[prismaName].updateMany({
            where: { id: unitId },
            data: { departmentId: defaultDepartment?.id },
          });
        }

        // @ts-expect-error method properties are the same
        return prisma[prismaName].deleteMany({
          where: {
            id: unitId,
            updatedAt: {
              lte: new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * days),
            },
          },
        });
      }),
    );

    await createAuditLogEntry({
      action: { type: AuditLogActionType.UnitsPruned },
      prisma,
      executorId: sessionUserId,
    });

    return { count: arr.length };
  }

  @Get("/:id")
  @Description(
    "Get a unit by the `id` (/v1/admin/manage/units/xxxxxxxx) or get all units from a user by the `discordId` or `steamId` (/v1/admin/manage/units/null?discordId=xxxxx)",
  )
  @UsePermissions({
    permissions: [
      Permissions.ViewUnits,
      Permissions.DeleteUnits,
      Permissions.ManageUnits,
      Permissions.ManageAwardsAndQualifications,
    ],
  })
  async getUnit(
    @PathParams("id") unitId: string,
    @QueryParams("steamId", String) steamId?: string,
    @QueryParams("discordId", String) discordId?: string,
  ): Promise<APITypes.GetManageUnitByIdData> {
    const extraInclude = {
      qualifications: { include: { qualification: { include: { value: true } } } },
      logs: { take: 25, orderBy: { createdAt: "desc" } },
    } as const;

    if (steamId || discordId) {
      const OR = [];

      if (steamId) {
        OR.push({ user: { steamId } });
      } else if (discordId) {
        OR.push({ user: { discordId } });
      }

      const where = { OR };

      const [userOfficers, userDeputies, userCombinedOfficers, userCombinedDeputies] =
        await prisma.$transaction([
          prisma.officer.findMany({
            where,
            include: { ...leoProperties, ...extraInclude },
          }),
          prisma.emsFdDeputy.findMany({
            where,
            include: { ...unitProperties, ...extraInclude },
          }),
          prisma.combinedLeoUnit.findMany({
            where: { officers: { some: where } },
            include: combinedUnitProperties,
          }),
          prisma.combinedEmsFdUnit.findMany({
            where: { deputies: { some: where } },
            include: combinedEmsFdUnitProperties,
          }),
        ]);

      return {
        userOfficers,
        userDeputies,
        userCombinedUnits: [...userCombinedOfficers, ...userCombinedDeputies],
      } as any;
    }

    let unit: any = await prisma.officer.findUnique({
      where: { id: unitId },
      include: { ...leoProperties, ...extraInclude },
    });

    if (!unit) {
      unit = await prisma.emsFdDeputy.findUnique({
        where: { id: unitId },
        include: { ...unitProperties, ...extraInclude },
      });
    }

    if (!unit) {
      unit = await prisma.combinedLeoUnit.findUnique({
        where: { id: unitId },
        include: combinedUnitProperties,
      });
    }

    if (!unit) {
      unit = await prisma.combinedEmsFdUnit.findUnique({
        where: { id: unitId },
        include: combinedEmsFdUnitProperties,
      });
    }

    if (!unit) {
      throw new NotFound("unitNotFound");
    }

    return unit;
  }

  @Put("/off-duty")
  @Description("Set specified units off-duty")
  @UsePermissions({
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
    permissions: [
      Permissions.ManageUnitCallsigns,
      Permissions.ManageUnits,
      Permissions.ManageUnitRank,
    ],
  })
  @Description("Update a unit's callsign by its id")
  async updateCallsignUnit(
    @Context("sessionUserId") sessionUserId: string,
    @Context("user") user: User,
    @PathParams("unitId") unitId: string,
    @BodyParams() body: unknown,
    @Context("cad") cad: cad & { features?: Record<Feature, boolean> },
  ): Promise<APITypes.PutManageUnitCallsignData> {
    const data = validateSchema(UPDATE_UNIT_CALLSIGN_SCHEMA.partial(), body);

    const { type, unit } = await findUnit(unitId, undefined, {
      officer: leoProperties,
      emsFdDeputy: unitProperties,
    });

    if (!unit || type === "combined-ems-fd" || type === "combined-leo") {
      throw new NotFound("unitNotFound");
    }

    const prismaNames = {
      "ems-fd": "emsFdDeputy",
      leo: "officer",
    } as const;
    const t = prismaNames[type];

    const hasManageUnitCallsignPermission = hasPermission({
      permissionsToCheck: [Permissions.ManageUnitCallsigns],
      userToCheck: user,
    });
    const hasManageRankPermission = hasPermission({
      permissionsToCheck: [Permissions.ManageUnitRank],
      userToCheck: user,
    });

    const dataSubmit: {
      callsign: string | undefined;
      callsign2: string | undefined;
      rankId: string | null | undefined;
      position: string | null | undefined;
    } = {
      callsign2: undefined,
      callsign: undefined,
      rankId: undefined,
      position: undefined,
    };

    if (hasManageUnitCallsignPermission) {
      if (data.callsign && data.callsign2 && unit.departmentId) {
        const allowMultipleOfficersWithSameDeptPerUser = isFeatureEnabled({
          feature: Feature.ALLOW_MULTIPLE_UNITS_DEPARTMENTS_PER_USER,
          defaultReturn: false,
          features: cad.features,
        });

        await validateDuplicateCallsigns({
          departmentId: unit.departmentId,
          callsign1: data.callsign,
          callsign2: data.callsign2,
          unitId: unit.id,
          type,
          userId: allowMultipleOfficersWithSameDeptPerUser && unit.userId ? unit.userId : undefined,
        });
      }

      if (type === "leo") {
        await updateOfficerDivisionsCallsigns({
          officerId: unit.id,
          disconnectConnectArr: [],
          callsigns: data.callsigns,
        });
      }

      dataSubmit.callsign2 = data.callsign2;
      dataSubmit.callsign = data.callsign;
    }

    if (hasManageRankPermission) {
      dataSubmit.rankId = data.rank;
      dataSubmit.position = data.position;
    }

    // @ts-expect-error ignore
    const updated = await prisma[t].update({
      where: { id: unit.id },
      data: dataSubmit,
      include: type === "leo" ? leoProperties : unitProperties,
    });

    await createAuditLogEntry({
      action: { type: AuditLogActionType.UnitUpdate, new: updated, previous: unit as any },
      prisma,
      executorId: sessionUserId,
    });

    return updated;
  }

  @Put("/:id")
  @UsePermissions({
    permissions: [Permissions.ManageUnits],
  })
  @Description("Update a unit by its id")
  async updateUnit(
    @Context("sessionUserId") sessionUserId: string,
    @PathParams("id") id: string,
    @BodyParams() body: unknown,
    @Context("cad")
    cad: cad & { miscCadSettings: MiscCadSettings; features?: Record<Feature, boolean> },
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

    if (
      isBadgeNumbersEnabled &&
      typeof data.badgeNumberString !== "undefined" &&
      !data.badgeNumberString
    ) {
      throw new ExtendedBadRequest({ badgeNumberString: "Required" });
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

        validateMaxDivisionsPerUnit(data.divisions, cad);

        const disconnectConnectArr = manyToManyHelper(
          (unit.divisions as { id: string }[]).map((v) => v.id),
          data.divisions as string[],
          { showUpsert: false },
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
        divisionId: type === "officer" ? undefined : data.division,
        rankId: data.rank,
        position: data.position,
        suspended: data.suspended ?? false,
        callsign2: data.callsign2,
        callsign: data.callsign,
        badgeNumberString: data.badgeNumberString,
        imageId: validatedImageURL,
        imageBlurData: await generateBlurPlaceholder(validatedImageURL),
        userId: data.userId || undefined,
        isTemporary: Boolean(data.userId),
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
    @Context("sessionUserId") sessionUserId: string,
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
        }),
        fs.writeFile(image.path, image.buffer),
      ]);

      await createAuditLogEntry({
        action: { type: AuditLogActionType.UnitUpdate, new: data, previous: unit as any },
        prisma,
        executorId: sessionUserId,
      });

      return data;
    } catch {
      throw new BadRequest("errorUploadingImage");
    }
  }

  @Post("/departments/:unitId")
  @Description("Accept or decline a unit into a department")
  @UsePermissions({
    permissions: [Permissions.ManageUnits],
  })
  async acceptOrDeclineUnit(
    @PathParams("unitId") unitId: string,
    @BodyParams("action") action: Action | null,
    @BodyParams("type") type: AcceptDeclineType | null,
    @Context("sessionUserId") sessionUserId: string,
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

      await createAuditLogEntry({
        action: { type: AuditLogActionType.UnitDepartmentAccepted, new: updated },
        prisma,
        executorId: sessionUserId,
      });

      await sendUnitWhitelistStatusChangeWebhook(updated);

      return updated;
    }

    switch (action) {
      case "DELETE_UNIT": {
        // @ts-expect-error function has the same properties
        const updated = await prisma[prismaName].delete({
          where: { id: unit.id },
          include: unitType === "leo" ? leoProperties : unitProperties,
        });

        await createAuditLogEntry({
          action: { type: AuditLogActionType.UnitDepartmentDeclined, new: updated },
          prisma,
          executorId: sessionUserId,
        });

        await sendUnitWhitelistStatusChangeWebhook(updated);

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

        await createAuditLogEntry({
          action: { type: AuditLogActionType.UnitDepartmentDeclined, new: updated },
          prisma,
          executorId: sessionUserId,
        });

        await sendUnitWhitelistStatusChangeWebhook(updated);

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

        await createAuditLogEntry({
          action: { type: AuditLogActionType.UnitDepartmentDeclined, new: updated },
          prisma,
          executorId: sessionUserId,
        });
        await sendUnitWhitelistStatusChangeWebhook(updated);

        return updated;
      }
      default: {
        return null;
      }
    }
  }

  @Post("/:unitId/qualifications")
  @Description("Add a qualification to a unit")
  @UsePermissions({
    permissions: [Permissions.ManageUnits, Permissions.ManageAwardsAndQualifications],
  })
  async addUnitQualification(
    @PathParams("unitId") unitId: string,
    @Context("sessionUserId") sessionUserId: string,
    @BodyParams("qualificationId") qualificationId?: string,
  ): Promise<APITypes.PostManageUnitAddQualificationData> {
    const unit = await findUnit(unitId);

    if (unit.type === "combined-ems-fd" || unit.type === "combined-leo") {
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
      where: { id: String(qualificationId) },
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

    await createAuditLogEntry({
      action: {
        type: AuditLogActionType.UnitQualificationAdd,
        new: { unitId: unit.unit.id, qualification },
      },
      prisma,
      executorId: sessionUserId,
    });

    return qualification;
  }

  @Delete("/:unitId/qualifications/:qualificationId")
  @UsePermissions({
    permissions: [Permissions.ManageUnits, Permissions.ManageAwardsAndQualifications],
  })
  @Description("Delete a qualification from a unit")
  async deleteUnitQualification(
    @PathParams("unitId") unitId: string,
    @PathParams("qualificationId") qualificationId: string,
    @Context("sessionUserId") sessionUserId: string,
  ): Promise<APITypes.DeleteManageUnitQualificationData> {
    const unit = await findUnit(unitId);

    if (unit.type === "combined-ems-fd" || unit.type === "combined-leo") {
      throw new BadRequest("Cannot add qualifications to combined units");
    }

    if (!unit.unit) {
      throw new NotFound("unitNotFound");
    }

    const qualification = await prisma.unitQualification.delete({
      where: { id: qualificationId },
      include: {
        qualification: { include: { value: true, departments: { include: { value: true } } } },
      },
    });

    await createAuditLogEntry({
      action: {
        type: AuditLogActionType.UnitQualificationRemove,
        new: { unitId: unit.unit.id, qualification },
      },
      prisma,
      executorId: sessionUserId,
    });

    return true;
  }

  @Put("/:unitId/qualifications/:qualificationId")
  @Description("Suspend or unsuspend a unit's qualification")
  @UsePermissions({
    permissions: [Permissions.ManageUnits, Permissions.ManageAwardsAndQualifications],
  })
  async suspendOrUnsuspendUnitQualification(
    @PathParams("unitId") unitId: string,
    @PathParams("qualificationId") qualificationId: string,
    @Context("sessionUserId") sessionUserId: string,
    @BodyParams("type") suspendType: SuspendType,
  ): Promise<APITypes.PutManageUnitQualificationData> {
    if (!SUSPEND_TYPE.includes(suspendType)) {
      throw new BadRequest("invalidType");
    }

    const unit = await findUnit(unitId);

    if (unit.type === "combined-ems-fd" || unit.type === "combined-leo") {
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

    if (suspendType === "suspend") {
      await createAuditLogEntry({
        action: {
          type: AuditLogActionType.UnitQualificationSuspended,
          new: { unitId: unit.unit.id, qualification: updated },
        },
        prisma,
        executorId: sessionUserId,
      });
    }

    return updated;
  }

  @Delete("/:unitId")
  @UsePermissions({
    permissions: [Permissions.DeleteUnits],
  })
  async deleteUnit(
    @Context("sessionUserId") sessionUserId: string,
    @PathParams("unitId") unitId: string,
  ): Promise<APITypes.DeleteManageUnitByIdData> {
    const unit = await findUnit(unitId);

    if (unit.type === "combined-ems-fd" || unit.type === "combined-leo") {
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
      action: { type: AuditLogActionType.UnitDelete, new: unit.unit as any },
      prisma,
      executorId: sessionUserId,
    });

    return true;
  }
}

export async function sendUnitWhitelistStatusChangeWebhook(
  unit: (Officer | EmsFdDeputy) & {
    citizen: Pick<Citizen, "name" | "surname">;
    whitelistStatus: LeoWhitelistStatus;
  },
) {
  const t = await getTranslator({
    type: "webhooks",
    namespace: "WhitelistStatusChange",
  });

  const statuses = {
    [WhitelistStatus.ACCEPTED]: { color: 0x00ff00, name: t("accepted") },
    [WhitelistStatus.PENDING]: { color: 0xffa500, name: t("pending") },
    [WhitelistStatus.DECLINED]: { color: 0xff0000, name: t("declined") },
  } as const;

  const cad = await prisma.cad.findFirst({
    select: { miscCadSettings: { select: { callsignTemplate: true } } },
  });

  const status = statuses[unit.whitelistStatus.status].name;
  const color = statuses[unit.whitelistStatus.status].color;
  const unitName = `${unit.citizen.name} ${unit.citizen.surname}`;
  const unitCallsign = generateCallsign(
    unit as any,
    cad?.miscCadSettings?.callsignTemplate ?? null,
  );

  const description = t("departmentChangeDescription", {
    status,
    unit: `${unitCallsign} ${unitName}`,
  });

  const embeds: APIEmbed[] = [
    {
      description,
      color,
      title: t("departmentChangeTitle"),
    },
  ];

  await sendDiscordWebhook({
    data: { embeds },
    type: DiscordWebhookType.DEPARTMENT_WHITELIST_STATUS,
  });
  await sendRawWebhook({
    type: DiscordWebhookType.DEPARTMENT_WHITELIST_STATUS,
    data: unit,
  });
}
