import { MiscCadSettings, Rank, User, WhitelistStatus } from "@prisma/client";
import { UPDATE_UNIT_SCHEMA, UPDATE_UNIT_CALLSIGN_SCHEMA } from "@snailycad/schemas";
import { PathParams, BodyParams, Context } from "@tsed/common";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { Delete, Description, Get, Post, Put } from "@tsed/schema";
import { validateMaxDivisionsPerUnit } from "controllers/leo/my-officers/MyOfficersController";
import { combinedUnitProperties, leoProperties, unitProperties } from "lib/leo/activeOfficer";
import { findUnit } from "lib/leo/findUnit";
import { updateOfficerDivisionsCallsigns } from "lib/leo/utils";
import { validateDuplicateCallsigns } from "lib/leo/validateDuplicateCallsigns";
import { prisma } from "lib/prisma";
import { validateSchema } from "lib/validateSchema";
import { IsAuth } from "middlewares/IsAuth";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import { Socket } from "services/SocketService";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";
import { manyToManyHelper } from "utils/manyToMany";
import { AuditLogActionType, createAuditLogEntry } from "@snailycad/audit-logger/server";
import { isCuid } from "cuid";
import type * as APITypes from "@snailycad/types/api";

const ACTIONS = ["SET_DEPARTMENT_DEFAULT", "SET_DEPARTMENT_NULL", "DELETE_UNIT"] as const;
type Action = typeof ACTIONS[number];

const SUSPEND_TYPE = ["suspend", "unsuspend"] as const;
type SuspendType = "suspend" | "unsuspend";

export const ACCEPT_DECLINE_TYPES = ["ACCEPT", "DECLINE"] as const;
export type AcceptDeclineType = typeof ACCEPT_DECLINE_TYPES[number];

@UseBeforeEach(IsAuth)
@Controller("/admin/manage/units")
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
    ],
  })
  async getUnits(): Promise<APITypes.GetManageUnitsData> {
    const units = await Promise.all([
      (
        await prisma.officer.findMany({ include: leoProperties })
      ).map((v) => ({ ...v, type: "OFFICER" as const })),
      (
        await prisma.emsFdDeputy.findMany({ include: unitProperties })
      ).map((v) => ({ ...v, type: "DEPUTY" as const })),
    ]);

    return units.flat(1);
  }

  @Get("/:id")
  @Description(
    "Get a unit by the `id` or get all units from a user by the `discordId` or `steamId`",
  )
  @UsePermissions({
    fallback: (u) => u.isSupervisor || u.rank !== Rank.USER,
    permissions: [Permissions.ViewUnits, Permissions.DeleteUnits, Permissions.ManageUnits],
  })
  async getUnit(@PathParams("id") id: string): Promise<APITypes.GetManageUnitByIdData> {
    const extraInclude = {
      qualifications: { include: { qualification: { include: { value: true } } } },
      logs: true,
    };

    const isUnitId = isCuid(id);
    const functionName = isUnitId ? "findFirst" : "findMany";

    // @ts-expect-error same function properties
    let unit: any = await prisma.officer[functionName]({
      where: {
        OR: [{ id }, { user: { discordId: id } }, { user: { steamId: id } }],
      },
      include: { ...leoProperties, ...extraInclude },
    });

    if (Array.isArray(unit) ? !unit.length : !unit) {
      // @ts-expect-error same function properties
      unit = await prisma.emsFdDeputy[functionName]({
        where: {
          OR: [{ id }, { user: { discordId: id } }, { user: { steamId: id } }],
        },
        include: { ...unitProperties, ...extraInclude },
      });
    }

    if (Array.isArray(unit) ? !unit.length : !unit) {
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

  @Put("/off-duty")
  @Description("Set specified units off-duty")
  @UsePermissions({
    fallback: (u) => u.isSupervisor || u.rank !== Rank.USER,
    permissions: [Permissions.ManageUnits],
  })
  async setSelectedOffDuty(
    @BodyParams("ids") ids: string[],
    @Context("user") sessionUser: User,
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
      prisma,
      action: { type: AuditLogActionType.UnitsSetOffDuty, new: ids, previous: undefined },
      executorId: sessionUser.id,
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
    @Context("user") user: User,
    @PathParams("unitId") unitId: string,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PutManageUnitCallsignData> {
    const data = validateSchema(UPDATE_UNIT_CALLSIGN_SCHEMA, body);

    const { type, unit } = await findUnit(unitId);

    if (!unit || type === "combined") {
      throw new NotFound("unitNotFound");
    }

    const prismaNames = {
      "ems-fd": "emsFdDeputy",
      leo: "officer",
    } as const;
    const t = prismaNames[type];

    await validateDuplicateCallsigns({
      callsign1: data.callsign,
      callsign2: data.callsign2,
      unitId: unit.id,
      type,
    });

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

    await createAuditLogEntry({
      prisma,
      action: { type: AuditLogActionType.UnitUpdate, new: updated, previous: unit },
      executorId: user.id,
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
    @Context("user") user: User,
    @PathParams("id") id: string,
    @BodyParams() body: unknown,
    @Context("cad") cad: { miscCadSettings: MiscCadSettings },
  ): Promise<APITypes.PutManageUnitData> {
    const data = validateSchema(UPDATE_UNIT_SCHEMA, body);

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

    if (type === "officer") {
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

    // @ts-expect-error ignore
    const updated = await prisma[type].update({
      where: { id: unit.id },
      data: {
        statusId: data.status,
        departmentId: data.department,
        divisionId: data.division,
        rankId: data.rank || null,
        position: data.position || null,
        suspended: data.suspended ?? false,
        callsign2: data.callsign2,
        callsign: data.callsign,
        badgeNumber: data.badgeNumber,
      },
      include: type === "officer" ? leoProperties : unitProperties,
    });

    await createAuditLogEntry({
      prisma,
      action: { type: AuditLogActionType.UnitUpdate, new: updated, previous: unit },
      executorId: user.id,
    });

    return updated;
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
        // @ts-expect-error function has the same properties
        const updated = await prisma[prismaName].update({
          where: { id: unit.id },
          data: { departmentId: null },
          include: unitType === "leo" ? leoProperties : unitProperties,
        });

        if (unit.whitelistStatusId) {
          await prisma.leoWhitelistStatus.update({
            where: { id: unit.whitelistStatusId },
            data: { status: WhitelistStatus.DECLINED },
          });
        }

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
    permissions: [Permissions.ManageUnits],
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
    permissions: [Permissions.ManageUnits],
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
    permissions: [Permissions.ManageUnits],
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
    @Context("user") user: User,
    @PathParams("unitId") unitId: string,
  ): Promise<APITypes.DeleteManageUnitByIdData> {
    const unit = await findUnit(unitId);

    if (unit.type === "combined") {
      throw new BadRequest("Cannot add qualifications to combined units");
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
      action: {
        type: AuditLogActionType.UnitDelete,
        new: unit.unit,
        previous: undefined,
      },
      prisma,
      executorId: user.id,
    });

    return true;
  }
}
