import { Prisma } from "@prisma/client";
import { QueryParams } from "@tsed/common";
import { Controller } from "@tsed/di";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { ContentType, Description, Get } from "@tsed/schema";
import { createWhere } from "controllers/leo/create-where-obj";
import differenceInHours from "date-fns/differenceInHours";
import type * as APITypes from "@snailycad/types/api";
import { prisma } from "lib/data/prisma";
import { IsAuth } from "middlewares/auth/is-auth";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import { _leoProperties, unitProperties } from "utils/leo/includes";
import { getFirstOrderBy } from "~/utils/order-by";

export const ACCEPT_DECLINE_TYPES = ["ACCEPT", "DECLINE"] as const;
export type AcceptDeclineType = (typeof ACCEPT_DECLINE_TYPES)[number];

@UseBeforeEach(IsAuth)
@Controller("/admin/manage/units/department-time-logs")
@ContentType("application/json")
export class AdminManageUnitsController {
  @Get("/units")
  @Description("Get all unit hours logged grouped by unit.")
  @UsePermissions({
    permissions: [
      Permissions.ViewUnits,
      Permissions.DeleteUnits,
      Permissions.ManageUnits,
      Permissions.ManageUnitCallsigns,
      Permissions.ManageAwardsAndQualifications,
    ],
  })
  async getTimeGroupedByUnit(
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("includeAll", Boolean) includeAll = false,
    @QueryParams("startDate", String) startDate?: string,
    @QueryParams("endDate", String) endDate?: string,
    @QueryParams("query", String) query?: string,
    @QueryParams("sorting") sorting = "",
  ): Promise<APITypes.GetDepartmentTimeLogsUnitsData> {
    const _startDate = startDate ? new Date(startDate) : undefined;
    _startDate?.setHours(0, 0, 0, 0);

    const _endDate = endDate ? new Date(endDate) : undefined;
    _endDate?.setHours(23, 59, 59, 999);

    const where = {
      createdAt: {
        gte: _startDate,
        lte: _endDate,
      },
    } as Prisma.OfficerLogWhereInput;

    if (query) {
      where.OR = [
        { officer: createWhere({ query, pendingOnly: false, type: "OFFICER" }) },
        { emsFdDeputy: createWhere({ query, pendingOnly: false, type: "DEPUTY" }) },
      ];
    }

    const officerLogs = await prisma.officerLog.findMany({
      include: { officer: { include: _leoProperties }, emsFdDeputy: { include: unitProperties } },
      where,
    });

    const groupedByUnit = new Map<
      string,
      {
        hours: number;
        unit: any;
        unitId: string;
        firstSeen: Date;
        lastSeen: Date;
      }
    >();
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

        groupedByUnit.set(unitId, newUnit as any);
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

    const units = Array.from(groupedByUnit.values());

    const orderBy = getFirstOrderBy(sorting);
    // we have to manually sort here since we have to sort by:
    // firstSeen, lastSeen, department or hours
    const sortedByHours = units.sort((a, b) => {
      if (!orderBy) return b.hours - a.hours;
      const [key, sortOrder] = orderBy;

      switch (key) {
        case "hours": {
          return sortOrder === "asc" ? a.hours - b.hours : b.hours - a.hours;
        }
        case "firstSeen": {
          return sortOrder === "asc"
            ? a.firstSeen.getTime() - b.firstSeen.getTime()
            : b.firstSeen.getTime() - a.firstSeen.getTime();
        }
        case "lastSeen": {
          return sortOrder === "asc"
            ? a.lastSeen.getTime() - b.lastSeen.getTime()
            : b.lastSeen.getTime() - a.lastSeen.getTime();
        }
        case "department": {
          return sortOrder === "asc"
            ? a.unit.department.value.value.localeCompare(b.unit.department.value.value)
            : b.unit.department.value.value.localeCompare(a.unit.department.value.value);
        }
        default: {
          return b.hours - a.hours;
        }
      }
    });

    const skipped = includeAll ? sortedByHours : sortedByHours.slice(skip, skip + 35);
    const totalCount = sortedByHours.length;

    return { logs: skipped, totalCount };
  }

  @Get("/departments")
  @Description("Get all unit hours logged grouped by department.")
  @UsePermissions({
    permissions: [
      Permissions.ViewUnits,
      Permissions.DeleteUnits,
      Permissions.ManageUnits,
      Permissions.ManageUnitCallsigns,
      Permissions.ManageAwardsAndQualifications,
    ],
  })
  async getTimeGroupedByDepartment(
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("includeAll", Boolean) includeAll = false,
    @QueryParams("query", String) query = "",
    @QueryParams("sorting") sorting = "",
  ): Promise<APITypes.GetDepartmentTimeLogsDepartmentsData> {
    const departmentInclude = {
      department: { include: { value: true } },
    };

    const where = query
      ? {
          OR: [
            {
              emsFdDeputy: {
                department: {
                  value: { value: { contains: query, mode: Prisma.QueryMode.insensitive } },
                },
              },
            },
            {
              officer: {
                department: {
                  value: { value: { contains: query, mode: Prisma.QueryMode.insensitive } },
                },
              },
            },
          ],
        }
      : undefined;

    const officerLogs = await prisma.officerLog.findMany({
      include: {
        officer: { include: departmentInclude },
        emsFdDeputy: { include: departmentInclude },
      },
      orderBy: { createdAt: "desc" },
      where,
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

    const departments = Array.from(groupedByDepartment.values());
    const orderBy = getFirstOrderBy(sorting);
    // we have to manually sort here since we have to sort by:
    // hours or department
    const sortedByHours = departments.sort((a, b) => {
      if (!orderBy) return b.hours - a.hours;

      const [key, sortOrder] = orderBy;

      switch (key) {
        case "hours": {
          return sortOrder === "asc" ? a.hours - b.hours : b.hours - a.hours;
        }
        case "department": {
          return sortOrder === "asc"
            ? a.department.value.value.localeCompare(b.department.value.value)
            : b.department.value.value.localeCompare(a.department.value.value);
        }
        default: {
          return b.hours - a.hours;
        }
      }
    });

    const skipped = includeAll ? sortedByHours : sortedByHours.slice(skip, skip + 35);
    const totalCount = sortedByHours.length;

    return { logs: skipped, totalCount };
  }
}
