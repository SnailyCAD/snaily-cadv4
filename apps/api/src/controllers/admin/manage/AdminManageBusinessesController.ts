import { Prisma, Rank, User } from "@prisma/client";
import { Controller } from "@tsed/di";
import { NotFound } from "@tsed/exceptions";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { BodyParams, Context, PathParams, QueryParams } from "@tsed/platform-params";
import { ContentType, Delete, Description, Get, Put } from "@tsed/schema";
import { userProperties } from "lib/auth/getSessionUser";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import type * as APITypes from "@snailycad/types/api";
import { validateSchema } from "lib/validateSchema";
import { UPDATE_EMPLOYEE_SCHEMA } from "@snailycad/schemas";
import { EmployeeAsEnum } from "@snailycad/types";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";

const businessInclude = {
  citizen: {
    select: {
      name: true,
      surname: true,
      id: true,
    },
  },
  user: {
    select: userProperties,
  },
};

@UseBeforeEach(IsAuth)
@Controller("/admin/manage/businesses")
@ContentType("application/json")
export class AdminManageBusinessesController {
  @Get("/")
  @Description("Get all the businesses within the CAD")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [
      Permissions.ViewBusinesses,
      Permissions.DeleteBusinesses,
      Permissions.ManageBusinesses,
    ],
  })
  async getBusinesses(): Promise<APITypes.GetManageBusinessesData> {
    const businesses = await prisma.business.findMany({ include: businessInclude });

    return businesses;
  }

  @Get("/:id/employees")
  @Description("Get the employees of a business")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [
      Permissions.ViewBusinesses,
      Permissions.DeleteBusinesses,
      Permissions.ManageBusinesses,
    ],
  })
  async getBusinessEmployees(
    @PathParams("businessId") businessId: string,
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("includeAll", Boolean) includeAll = false,
    @QueryParams("query", String) query = "",
  ): Promise<APITypes.GetManageBusinessByIdEmployeesData> {
    let where: Prisma.EmployeeFindManyArgs["where"] = {
      businessId,
    };

    if (query) {
      where = {
        ...where,
        // todo: filter by name, rank
      };
    }

    const [totalCount, employees] = await prisma.$transaction([
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

    return { totalCount, employees };
  }

  @Put("/employees/:id")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.DeleteBusinesses, Permissions.ManageBusinesses],
  })
  async updateBusinessEmployee(@PathParams("id") employeeId: string, @BodyParams() body: unknown) {
    const data = validateSchema(UPDATE_EMPLOYEE_SCHEMA, body);
    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        NOT: { role: { as: EmployeeAsEnum.OWNER } },
      },
    });

    if (!employee) {
      throw new NotFound("employeeNotFound");
    }

    const role = await prisma.employeeValue.findUnique({
      where: {
        id: data.roleId,
      },
    });

    if (!role || role.as === EmployeeAsEnum.OWNER) {
      throw new ExtendedBadRequest({ roleId: "cannotSetRoleToOwner" });
    }

    const updated = await prisma.employee.update({
      where: { id: employeeId },
      data: {
        employeeOfTheMonth: data.employeeOfTheMonth,
        canCreatePosts: data.canCreatePosts,
        roleId: role.id,
      },
      include: {
        citizen: true,
        role: { include: { value: true } },
      },
    });

    return updated;
  }

  @Delete("/employees/:id")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.DeleteBusinesses, Permissions.ManageBusinesses],
  })
  async fireEmployee(
    @PathParams("id") employeeId: string,
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
    });

    if (!employeeToDelete) {
      throw new NotFound("employeeNotFound");
    }

    await prisma.employee.delete({
      where: {
        id: employeeToDelete.id,
      },
    });

    return true;
  }

  @Put("/:id")
  @Description("Update a business by its id")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageBusinesses],
  })
  async updateBusiness(
    @BodyParams() body: any,
    @PathParams("id") businessId: string,
  ): Promise<APITypes.PutManageBusinessesData> {
    const business = await prisma.business.findUnique({
      where: {
        id: businessId,
      },
    });

    if (!business) {
      throw new NotFound("notFound");
    }

    const updated = await prisma.business.update({
      where: { id: businessId },
      data: { status: body.status },
      include: businessInclude,
    });

    return updated;
  }

  @Delete("/:id")
  @Description("Delete a business by its id")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.DeleteBusinesses],
  })
  async deleteBusiness(
    @Context("user") user: User,
    @BodyParams() body: any,
    @PathParams("id") businessId: string,
  ): Promise<APITypes.DeleteManageBusinessesData> {
    const reason = body.reason;

    const business = await prisma.business.findUnique({
      where: {
        id: businessId,
      },
    });

    if (!business) {
      throw new NotFound("notFound");
    }

    await prisma.notification.create({
      data: {
        userId: business.userId,
        executorId: user.id,
        description: reason,
        title: "BUSINESS_DELETED",
      },
    });

    await prisma.business.delete({
      where: {
        id: businessId,
      },
    });

    return true;
  }
}
