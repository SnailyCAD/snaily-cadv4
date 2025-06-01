import { Controller } from "@tsed/di";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { QueryParams, PathParams, BodyParams } from "@tsed/platform-params";
import { ContentType, Description, Get, Post } from "@tsed/schema";
import { userProperties } from "lib/auth/getSessionUser";
import { leoProperties } from "utils/leo/includes";

import { prisma } from "lib/data/prisma";
import { IsAuth } from "middlewares/auth/is-auth";
import { Prisma, WhitelistStatus } from "@prisma/client";
import { UsePermissions, Permissions } from "middlewares/use-permissions";

import type * as APITypes from "@snailycad/types/api";
import { type AcceptDeclineType, ACCEPT_DECLINE_TYPES } from "../units/manage-units-controller";
import { BadRequest, NotFound } from "@tsed/exceptions";

export const recordsLogsInclude = {
  officer: { include: leoProperties },
  violations: {
    include: {
      penalCode: { include: { warningApplicable: true, warningNotApplicable: true } },
    },
  },
  seizedItems: true,
  courtEntry: { include: { dates: true } },
  vehicle: { include: { model: { include: { value: true } } } },
};

@UseBeforeEach(IsAuth)
@Controller("/admin/manage")
@ContentType("application/json")
export class AdminManageCitizensController {
  @Get("/records-logs")
  @Description("Get all the record logs within the CAD")
  @UsePermissions({
    permissions: [
      Permissions.ViewCitizens,
      Permissions.ManageCitizens,
      Permissions.DeleteCitizens,
      Permissions.ViewCitizenLogs,
    ],
  })
  async getRecordLogsForCitizen(
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("includeAll", Boolean) includeAll = false,
    @QueryParams("query", String) query = "",
  ): Promise<APITypes.GetManageRecordLogsData> {
    const [name, surname] = query.toString().toLowerCase().split(/ +/g);

    const where = {
      OR: [
        {
          name: { contains: name, mode: Prisma.QueryMode.insensitive },
          surname: { contains: surname, mode: Prisma.QueryMode.insensitive },
        },
        {
          name: { equals: surname, mode: Prisma.QueryMode.insensitive },
          surname: { equals: name, mode: Prisma.QueryMode.insensitive },
        },
      ],
    };

    const [totalCount, citizens] = await prisma.$transaction([
      prisma.citizen.count({
        where: { RecordLog: { some: {} }, ...where },
      }),
      prisma.citizen.findMany({
        orderBy: { createdAt: "desc" },
        where: { RecordLog: { some: {} }, ...where },
        take: includeAll ? undefined : 35,
        skip: includeAll ? undefined : skip,
      }),
    ]);

    return { citizens, totalCount };
  }

  @Get("/pending-citizen-records")
  @Description("Get all the record logs within the CAD")
  @UsePermissions({
    permissions: [
      Permissions.ViewCitizens,
      Permissions.ManageCitizens,
      Permissions.DeleteCitizens,
      Permissions.ViewCitizenLogs,
    ],
  })
  async getPendingCitizenRecords(
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("includeAll", Boolean) includeAll = false,
  ): Promise<APITypes.GetManagePendingCitizenRecords> {
    const [totalCount, pendingCitizenRecords] = await prisma.$transaction([
      prisma.recordLog.count({
        where: { records: { status: WhitelistStatus.PENDING } },
      }),
      prisma.recordLog.findMany({
        orderBy: { createdAt: "desc" },
        where: { records: { status: WhitelistStatus.PENDING } },
        take: includeAll ? undefined : 35,
        skip: includeAll ? undefined : skip,
        include: {
          warrant: { include: { officer: { include: leoProperties } } },
          records: { include: recordsLogsInclude },
          business: { include: { employees: { where: { role: { as: "OWNER" } } } } },
          citizen: {
            include: { user: { select: userProperties }, gender: true, ethnicity: true },
          },
        },
      }),
    ]);

    return { pendingCitizenRecords, totalCount };
  }

  @Get("/records-logs/:citizenId")
  async getCitizenRecordsLogs(
    @PathParams("citizenId") citizenId: string,
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("includeAll", Boolean) includeAll = false,
  ): Promise<APITypes.GetManageRecordsLogsCitizenData> {
    const [totalCount, recordsLogs] = await prisma.$transaction([
      prisma.recordLog.count({
        where: { OR: [{ citizenId }, { citizen: { socialSecurityNumber: citizenId } }] },
      }),
      prisma.recordLog.findMany({
        orderBy: { createdAt: "desc" },
        where: { OR: [{ citizenId }, { citizen: { socialSecurityNumber: citizenId } }] },
        take: includeAll ? undefined : 35,
        skip: includeAll ? undefined : skip,
        include: {
          warrant: { include: { officer: { include: leoProperties } } },
          records: { include: recordsLogsInclude },
          business: { include: { employees: { where: { role: { as: "OWNER" } } } } },
          citizen: {
            include: { user: { select: userProperties }, gender: true, ethnicity: true },
          },
        },
      }),
    ]);

    return { recordsLogs, totalCount };
  }

  @Post("/records-logs/:id")
  @Description("Accept or decline a record by it's id")
  @UsePermissions({
    permissions: [Permissions.ManageCitizens, Permissions.ViewCitizenLogs],
  })
  async acceptOrDeclinePendingCitizenLog(
    @PathParams("id") id: string,
    @BodyParams("type") type: AcceptDeclineType | null,
  ): Promise<APITypes.PostCitizenRecordLogsData> {
    if (!type || !ACCEPT_DECLINE_TYPES.includes(type)) {
      throw new BadRequest("invalidType");
    }

    const record = await prisma.record.findUnique({
      where: { id },
    });

    if (!record) {
      throw new NotFound("recordNotFound");
    }

    const updated = await prisma.record.update({
      where: { id: record.id },
      data: {
        status: type === "ACCEPT" ? WhitelistStatus.ACCEPTED : WhitelistStatus.DECLINED,
      },
      include: recordsLogsInclude,
    });

    return updated;
  }
}
