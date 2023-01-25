import { Rank } from "@prisma/client";
import { Controller } from "@tsed/di";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { ContentType, Description, Get } from "@tsed/schema";
import differenceInHours from "date-fns/differenceInHours";

import { prisma } from "lib/data/prisma";
import { _leoProperties, unitProperties } from "lib/leo/activeOfficer";
import { IsAuth } from "middlewares/is-auth";
import { UsePermissions, Permissions } from "middlewares/use-permissions";

export const ACCEPT_DECLINE_TYPES = ["ACCEPT", "DECLINE"] as const;
export type AcceptDeclineType = typeof ACCEPT_DECLINE_TYPES[number];

// todo: filters

@UseBeforeEach(IsAuth)
@Controller("/admin/manage/units/department-time-logs")
@ContentType("application/json")
export class AdminManageUnitsController {
  @Get("/units")
  @Description("Get all unit hours logged grouped by unit.")
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
  async getTimeGroupedByUnit() {
    const officerLogs = await prisma.officerLog.findMany({
      include: { officer: { include: _leoProperties }, emsFdDeputy: { include: unitProperties } },
      orderBy: { createdAt: "desc" },
    });

    const groupedByUnit = new Map<string, { hours: number; unit: any }>();
    const lastSeenMap = new Map<string, Date>();
    const firstSeenMap = new Map<string, Date>();

    for (const log of officerLogs) {
      if (log.endedAt === null) continue;

      const unitId = log.officerId || log.emsFdDeputyId;
      if (!unitId) continue;

      const unit = groupedByUnit.get(unitId);
      const hours = differenceInHours(new Date(log.endedAt), new Date(log.createdAt));

      if (unit) {
        let lastSeen = lastSeenMap.get(unitId);

        if (lastSeen) {
          if (log.endedAt.getTime() > lastSeen.getTime()) {
            lastSeen = log.endedAt;
            lastSeenMap.set(unitId, lastSeen);
          }
        }

        let firstSeen = firstSeenMap.get(unitId);

        if (firstSeen) {
          if (log.createdAt.getTime() < firstSeen.getTime()) {
            firstSeen = log.createdAt;
            firstSeenMap.set(unitId, firstSeen);
          }
        }

        const newUnit = {
          firstSeen,
          lastSeen,
          unitId,
          unit: log.officer || log.emsFdDeputy || null,
          hours: unit.hours + hours,
        };

        groupedByUnit.set(unitId, newUnit);
        continue;
      }

      const lastSeen = new Date(log.endedAt);
      const firstSeen = new Date(log.createdAt);

      lastSeenMap.set(unitId, lastSeen);
      firstSeenMap.set(unitId, firstSeen);

      const newUnit = {
        unitId,
        lastSeen,
        firstSeen,
        unit: log.officer || log.emsFdDeputy || null,
        hours,
      };
      groupedByUnit.set(unitId, newUnit);
    }

    return Array.from(groupedByUnit.values());
  }

  @Get("/departments")
  @Description("Get all unit hours logged grouped by department.")
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
  async getTimeGroupedByDepartment() {
    const departmentInclude = {
      department: { include: { value: true } },
    };

    const officerLogs = await prisma.officerLog.findMany({
      include: {
        officer: { include: departmentInclude },
        emsFdDeputy: { include: departmentInclude },
      },
      orderBy: { createdAt: "desc" },
    });

    const groupedByDepartment = new Map<
      string,
      { hours: number; department: any; departmentId: string }
    >();

    for (const log of officerLogs) {
      if (log.endedAt === null) continue;

      const departmentId = log.officer?.departmentId || log.emsFdDeputy?.departmentId;
      if (!departmentId) continue;

      const unitHours = groupedByDepartment.get(departmentId)?.hours ?? 0;
      const hours = differenceInHours(new Date(log.endedAt), new Date(log.createdAt));

      const newDepartment = {
        departmentId,
        department: log.officer?.department || log.emsFdDeputy?.department || null,
        hours: unitHours + hours,
      };

      groupedByDepartment.set(departmentId, newDepartment);
    }

    return Array.from(groupedByDepartment.values());
  }
}
