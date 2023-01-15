import { Controller } from "@tsed/di";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { ContentType, Delete, Hidden, Put } from "@tsed/schema";
import { IsAuth } from "middlewares/is-auth";
import { UPDATE_EMPLOYEE_SCHEMA, FIRE_EMPLOYEE_SCHEMA } from "@snailycad/schemas";
import { NotFound } from "@tsed/exceptions";
import { prisma } from "lib/data/prisma";
import { cad, EmployeeAsEnum, User, WhitelistStatus } from "@prisma/client";
import { validateBusinessAcceptance } from "utils/businesses";
import { validateSchema } from "lib/data/validate-schema";
import { ExtendedBadRequest } from "src/exceptions/extended-bad-request";
import type * as APITypes from "@snailycad/types/api";
import { Feature, IsFeatureEnabled } from "middlewares/is-enabled";

@UseBeforeEach(IsAuth)
@Controller("/businesses/employees")
@Hidden()
@ContentType("application/json")
@IsFeatureEnabled({ feature: Feature.BUSINESS })
export class BusinessEmployeeController {
  @Put("/:businessId/:id")
  async updateEmployee(
    @PathParams("id") employeeId: string,
    @PathParams("businessId") businessId: string,
    @Context("user") user: User,
    @Context("cad") cad: cad,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PutBusinessEmployeesData> {
    const data = validateSchema(UPDATE_EMPLOYEE_SCHEMA, body);

    await validateBusinessAcceptance(cad, businessId);

    const employee = await prisma.employee.findFirst({
      where: {
        id: data.employeeId,
        businessId,
        userId: user.id,
      },
      include: {
        role: true,
      },
    });

    if (!employee || employee.role?.as === "EMPLOYEE") {
      throw new NotFound("employeeNotFoundOrInvalidPermissions");
    }

    const employeeToUpdate = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        businessId,
        // not allowed to update the owner
        NOT: {
          role: {
            as: EmployeeAsEnum.OWNER,
          },
        },
      },
    });

    if (!employeeToUpdate) {
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
      where: {
        id: employeeToUpdate.id,
      },
      data: {
        employeeOfTheMonth: data.employeeOfTheMonth,
        canCreatePosts: data.canCreatePosts,
        roleId: data.roleId,
      },
      include: {
        business: true,
        citizen: true,
        role: {
          include: {
            value: true,
          },
        },
      },
    });

    return updated;
  }

  @Delete("/:businessId/:id")
  async fireEmployee(
    @PathParams("id") employeeId: string,
    @PathParams("businessId") businessId: string,
    @Context("user") user: User,
    @Context("cad") cad: cad,
    @BodyParams() body: unknown,
  ): Promise<APITypes.DeleteBusinessFireEmployeeData> {
    const data = validateSchema(FIRE_EMPLOYEE_SCHEMA, body);

    await validateBusinessAcceptance(cad, businessId);

    const employee = await prisma.employee.findFirst({
      where: {
        id: data.employeeId,
        businessId,
        userId: user.id,
      },
      include: {
        role: true,
      },
    });

    if (!employee || employee.role?.as === "EMPLOYEE") {
      throw new NotFound("employeeNotFoundOrInvalidPermissions");
    }

    const employeeToDelete = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        businessId,
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

  @Put("/:businessId/:id/:type")
  async acceptOrDeclineEmployee(
    @PathParams("type") type: "accept" | "decline",
    @PathParams("id") employeeId: string,
    @PathParams("businessId") businessId: string,
    @Context("user") user: User,
    @Context("cad") cad: cad,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PostBusinessAcceptDeclineData> {
    const data = validateSchema(FIRE_EMPLOYEE_SCHEMA, body);

    await validateBusinessAcceptance(cad, businessId);

    const employee = await prisma.employee.findFirst({
      where: {
        id: data.employeeId,
        businessId,
        userId: user.id,
      },
      include: {
        role: true,
      },
    });

    if (!employee || employee.role?.as === "EMPLOYEE") {
      throw new NotFound("employeeNotFoundOrInvalidPermissions");
    }

    const employeeToUpdate = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        businessId,
        whitelistStatus: WhitelistStatus.PENDING,
      },
    });

    if (!employeeToUpdate) {
      throw new NotFound("employeeNotFound");
    }

    const status = type === "accept" ? WhitelistStatus.ACCEPTED : WhitelistStatus.DECLINED;
    const updated = await prisma.employee.update({
      where: {
        id: employeeToUpdate.id,
      },
      data: {
        whitelistStatus: status,
      },
    });

    return updated;
  }
}
