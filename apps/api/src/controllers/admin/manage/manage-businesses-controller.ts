import { type Prisma, WhitelistStatus } from "@prisma/client";
import { Controller } from "@tsed/di";
import { NotFound } from "@tsed/exceptions";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { BodyParams, Context, PathParams, QueryParams } from "@tsed/platform-params";
import { ContentType, Delete, Description, Get, Put } from "@tsed/schema";
import { userProperties } from "lib/auth/getSessionUser";
import { prisma } from "lib/data/prisma";
import { IsAuth } from "middlewares/auth/is-auth";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import type * as APITypes from "@snailycad/types/api";
import { validateSchema } from "lib/data/validate-schema";
import { UPDATE_EMPLOYEE_SCHEMA } from "@snailycad/schemas";
import { EmployeeAsEnum } from "@snailycad/types";
import { ExtendedBadRequest } from "~/exceptions/extended-bad-request";
import { AuditLogActionType, createAuditLogEntry } from "@snailycad/audit-logger/server";
import { getPrismaModelOrderBy } from "~/utils/order-by";

const businessInclude = {
  user: {
    select: userProperties,
  },
  employees: { include: { citizen: true }, where: { role: { as: "OWNER" } } },
} as const;

@UseBeforeEach(IsAuth)
@Controller("/admin/manage/businesses")
@ContentType("application/json")
export class AdminManageBusinessesController {
  @Get("/")
  @Description("Get all the businesses within the CAD")
  @UsePermissions({
    permissions: [
      Permissions.ViewBusinesses,
      Permissions.DeleteBusinesses,
      Permissions.ManageBusinesses,
    ],
  })
  async getBusinesses(
    @QueryParams("pendingOnly", Boolean) pendingOnly = false,
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("includeAll", Boolean) includeAll = false,
    @QueryParams("query", String) query = "",
    @QueryParams("sorting") sorting = "",
  ): Promise<APITypes.GetManageBusinessesData> {
    const where = {} as Prisma.BusinessWhereInput;

    if (query) {
      where.OR = [{ address: { contains: query } }, { name: { contains: query } }];
    }

    if (pendingOnly) {
      where.status = WhitelistStatus.PENDING;
    }

    const orderBy = getPrismaModelOrderBy(sorting);
    const [totalCount, businesses] = await prisma.$transaction([
      prisma.business.count({ where }),
      prisma.business.findMany({
        take: includeAll ? undefined : 35,
        skip: includeAll ? undefined : skip,
        where,
        include: businessInclude,
        orderBy,
      }),
    ]);

    return { businesses, totalCount };
  }

  @Get("/:id/employees")
  @Description("Get the employees of a business")
  @UsePermissions({
    permissions: [
      Permissions.ViewBusinesses,
      Permissions.DeleteBusinesses,
      Permissions.ManageBusinesses,
    ],
  })
  async getBusinessEmployees(
    @PathParams("id") businessId: string,
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("includeAll", Boolean) includeAll = false,
  ): Promise<APITypes.GetManageBusinessByIdEmployeesData> {
    const where: Prisma.EmployeeFindManyArgs["where"] = {
      businessId,
    };

    const [business, totalCount, employees] = await prisma.$transaction([
      prisma.business.findUnique({
        where: { id: businessId },
        select: { status: true },
      }),
      prisma.employee.count({ where }),
      prisma.employee.findMany({
        where,
        take: includeAll ? undefined : 35,
        skip: includeAll ? undefined : skip,
        include: {
          citizen: true,
          role: { include: { value: true } },
        },
      }),
    ]);

    return { ...business, totalCount, employees };
  }

  @Put("/employees/:id")
  @UsePermissions({
    permissions: [Permissions.DeleteBusinesses, Permissions.ManageBusinesses],
  })
  async updateBusinessEmployee(
    @PathParams("id") employeeId: string,
    @Context("sessionUserId") sessionUserId: string,
    @BodyParams() body: unknown,
  ) {
    const data = validateSchema(UPDATE_EMPLOYEE_SCHEMA, body);
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId },
      include: { citizen: true, role: { include: { value: true } } },
    });

    if (!employee) {
      throw new NotFound("employeeNotFound");
    }

    const role = await prisma.employeeValue.findUnique({
      where: {
        id: data.roleId,
      },
    });

    if (!role) {
      throw new ExtendedBadRequest({ roleId: "roleNotFound" });
    }

    const updated = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        employeeOfTheMonth: data.employeeOfTheMonth,
        canCreatePosts: data.canCreatePosts,
        roleId: role.id,
        canManageEmployees: data.canManageEmployees,
        canManageVehicles: data.canManageVehicles,
      },
      include: {
        citizen: true,
        role: { include: { value: true } },
      },
    });

    await createAuditLogEntry({
      action: {
        type: AuditLogActionType.BusinessEmployeeUpdate,
        previous: employee,
        new: updated,
      },
      prisma,
      executorId: sessionUserId,
    });

    return updated;
  }

  @Delete("/employees/:id")
  @UsePermissions({
    permissions: [Permissions.DeleteBusinesses, Permissions.ManageBusinesses],
  })
  async fireEmployee(
    @PathParams("id") employeeId: string,
    @Context("sessionUserId") sessionUserId: string,
  ): Promise<APITypes.DeleteBusinessFireEmployeeData> {
    const employeeToDelete = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        // not allowed to delete the owner
        NOT: {
          role: {
            as: EmployeeAsEnum.OWNER,
          },
        },
      },
      include: { citizen: true },
    });

    if (!employeeToDelete) {
      throw new NotFound("employeeNotFound");
    }

    await prisma.employee.delete({
      where: {
        id: employeeToDelete.id,
      },
    });

    await createAuditLogEntry({
      action: {
        type: AuditLogActionType.BusinessEmployeeFire,
        new: employeeToDelete,
      },
      prisma,
      executorId: sessionUserId,
    });

    return true;
  }

  @Put("/:id")
  @Description("Update a business by its id")
  @UsePermissions({
    permissions: [Permissions.ManageBusinesses],
  })
  async updateBusiness(
    @BodyParams() body: any,
    @PathParams("id") businessId: string,
    @Context("sessionUserId") sessionUserId: string,
  ): Promise<APITypes.PutManageBusinessesData> {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: businessInclude,
    });

    if (!business) {
      throw new NotFound("notFound");
    }

    const updated = await prisma.business.update({
      where: { id: businessId },
      data: { status: body.status },
      include: businessInclude,
    });

    await createAuditLogEntry({
      action: {
        type: AuditLogActionType.BusinessUpdate,
        previous: business,
        new: updated,
      },
      prisma,
      executorId: sessionUserId,
    });

    return updated;
  }

  @Delete("/:id")
  @Description("Delete a business by its id")
  @UsePermissions({
    permissions: [Permissions.DeleteBusinesses],
  })
  async deleteBusiness(
    @PathParams("id") businessId: string,
    @Context("sessionUserId") sessionUserId: string,
  ): Promise<APITypes.DeleteManageBusinessesData> {
    const business = await prisma.business.findUnique({
      where: {
        id: businessId,
      },
    });

    if (!business) {
      throw new NotFound("notFound");
    }

    await prisma.business.delete({
      where: { id: businessId },
    });

    await createAuditLogEntry({
      action: {
        type: AuditLogActionType.BusinessDelete,
        new: business,
      },
      prisma,
      executorId: sessionUserId,
    });

    return true;
  }
}
