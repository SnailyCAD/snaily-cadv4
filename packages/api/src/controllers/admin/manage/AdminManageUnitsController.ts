import { Rank, WhitelistStatus } from "@prisma/client";
import { UPDATE_UNIT_SCHEMA } from "@snailycad/schemas";
import { PathParams, BodyParams, Context } from "@tsed/common";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { Delete, Description, Get, Post, Put } from "@tsed/schema";
import { validateMaxDivisionsPerOfficer } from "controllers/leo/LeoController";
import { leoProperties, unitProperties } from "lib/leo/activeOfficer";
import { findUnit } from "lib/leo/findUnit";
import { prisma } from "lib/prisma";
import { validateSchema } from "lib/validateSchema";
import { IsAuth } from "middlewares/IsAuth";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import { Socket } from "services/SocketService";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";
import { manyToManyHelper } from "utils/manyToMany";

const ACTIONS = ["SET_DEPARTMENT_DEFAULT", "SET_DEPARTMENT_NULL", "DELETE_OFFICER"] as const;
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
    permissions: [Permissions.ViewUnits, Permissions.DeleteUnits, Permissions.ManageUnits],
  })
  async getUnits() {
    const units = await Promise.all([
      (
        await prisma.officer.findMany({ include: leoProperties })
      ).map((v) => ({ ...v, type: "OFFICER" })),
      (
        await prisma.emsFdDeputy.findMany({ include: unitProperties })
      ).map((v) => ({ ...v, type: "DEPUTY" })),
    ]);

    return units.flat(1);
  }

  @Get("/:id")
  @Description("Get a unit by their id")
  @UsePermissions({
    fallback: (u) => u.isSupervisor || u.rank !== Rank.USER,
    permissions: [Permissions.ViewUnits, Permissions.DeleteUnits, Permissions.ManageUnits],
  })
  async getUnit(@PathParams("id") id: string) {
    const extraInclude = {
      qualifications: { include: { qualification: { include: { value: true } } } },
    };

    let unit: any = await prisma.officer.findUnique({
      where: { id },
      include: { ...leoProperties, ...extraInclude, logs: true },
    });

    if (!unit) {
      unit = await prisma.emsFdDeputy.findUnique({
        where: { id },
        include: { ...unitProperties, ...extraInclude },
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
  async setSelectedOffDuty(@BodyParams("ids") ids: string[]) {
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
          data: {
            statusId: null,
          },
        });
      }),
    );

    this.socket.emitUpdateDeputyStatus();
    this.socket.emitUpdateOfficerStatus();

    return updated;
  }

  @Put("/:id")
  @UsePermissions({
    fallback: (u) => u.isSupervisor || u.rank !== Rank.USER,
    permissions: [Permissions.ManageUnits],
  })
  @Description("Update a unit by its id")
  async updateUnit(
    @PathParams("id") id: string,
    @BodyParams() body: unknown,
    @Context("cad") cad: any,
  ) {
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

      await validateMaxDivisionsPerOfficer(data.divisions, cad);

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
        suspended: data.suspended ?? false,
        callsign2: data.callsign2,
        callsign: data.callsign,
        badgeNumber: data.badgeNumber,
      },
      include: type === "officer" ? leoProperties : unitProperties,
    });

    return updated;
  }

  @Post("/departments/:officerId")
  @Description("Accept or decline a unit into a department")
  @UsePermissions({
    fallback: (u) => u.isSupervisor || u.rank !== Rank.USER,
    permissions: [Permissions.ManageUnits],
  })
  async acceptOrDeclineUnit(
    @PathParams("officerId") officerId: string,
    @BodyParams("action") action: Action | null,
    @BodyParams("type") type: AcceptDeclineType | null,
  ) {
    if (action && !ACTIONS.includes(action)) {
      throw new ExtendedBadRequest({ action: "Invalid Action" });
    }

    if (!type || !ACCEPT_DECLINE_TYPES.includes(type)) {
      throw new BadRequest("invalidType");
    }

    const officer = await prisma.officer.findUnique({
      where: { id: officerId },
      include: leoProperties,
    });

    if (!officer) {
      throw new NotFound("officerNotFound");
    }

    if (!officer.whitelistStatus || officer.whitelistStatus.status !== WhitelistStatus.PENDING) {
      throw new BadRequest("officerIsNotAwaiting");
    }

    if (officer.whitelistStatusId) {
      await prisma.leoWhitelistStatus.update({
        where: { id: officer.whitelistStatusId },
        data: { status: type === "ACCEPT" ? WhitelistStatus.ACCEPTED : WhitelistStatus.DECLINED },
      });
    }

    if (type === "ACCEPT") {
      const updated = await prisma.officer.update({
        where: { id: officerId },
        data: {
          departmentId: officer.whitelistStatus.departmentId,
          rankId: officer.whitelistStatus.department.defaultOfficerRankId ?? undefined,
        },
        include: leoProperties,
      });

      return updated;
    }

    switch (action) {
      case "DELETE_OFFICER": {
        const updated = await prisma.officer.delete({
          where: { id: officer.id },
        });

        return { ...updated, deleted: true };
      }
      case "SET_DEPARTMENT_NULL": {
        const updated = await prisma.officer.update({
          where: { id: officer.id },
          data: {
            departmentId: null,
          },
          include: leoProperties,
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

        if (officer.whitelistStatusId) {
          await prisma.leoWhitelistStatus.update({
            where: { id: officer.whitelistStatusId },
            data: { status: WhitelistStatus.DECLINED },
          });
        }

        const updated = await prisma.officer.update({
          where: { id: officer.id },
          data: {
            departmentId: defaultDepartment.id,
          },
          include: leoProperties,
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
  ) {
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
      include: { qualification: { include: { value: true } } },
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
  ) {
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
  ) {
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
      include: { qualification: { include: { value: true } } },
    });

    return updated;
  }

  @Delete("/:unitId")
  @UsePermissions({
    fallback: (u) => u.isSupervisor || u.rank !== Rank.USER,
    permissions: [Permissions.DeleteUnits],
  })
  async deleteUnit(@PathParams("unitId") unitId: string) {
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

    return true;
  }
}
