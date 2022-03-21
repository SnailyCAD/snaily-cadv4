import { Rank, WhitelistStatus } from "@prisma/client";
import { UPDATE_UNIT_SCHEMA } from "@snailycad/schemas";
import { PathParams, BodyParams, Context } from "@tsed/common";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { Description, Get, Post, Put } from "@tsed/schema";
import { validateMaxDivisionsPerOfficer } from "controllers/leo/LeoController";
import { leoProperties, unitProperties } from "lib/leo/activeOfficer";
import { prisma } from "lib/prisma";
import { validateSchema } from "lib/validateSchema";
import { IsAuth } from "middlewares/IsAuth";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import { Socket } from "services/SocketService";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";
import { manyToManyHelper } from "utils/manyToMany";

const ACTIONS = ["SET_DEPARTMENT_DEFAULT", "SET_DEPARTMENT_NULL", "DELETE_OFFICER"] as const;
type Action = typeof ACTIONS[number];

const TYPES = ["ACCEPT", "DECLINE"] as const;
type Type = typeof TYPES[number];

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
    let unit: any = await prisma.officer.findUnique({
      where: { id },
      include: { ...leoProperties, logs: true },
    });

    if (!unit) {
      unit = await prisma.emsFdDeputy.findUnique({
        where: { id },
        include: unitProperties,
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
    @BodyParams("type") type: Type | null,
  ) {
    if (action && !ACTIONS.includes(action)) {
      throw new ExtendedBadRequest({ action: "Invalid Action" });
    }

    if (!type || !TYPES.includes(type)) {
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
}
