import { Controller } from "@tsed/di";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { Delete, JsonRequestBody, Put } from "@tsed/schema";
import { IsAuth } from "../../middlewares";
import { UPDATE_EMPLOYEE_SCHEMA, FIRE_EMPLOYEE_SCHEMA, validate } from "@snailycad/schemas";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "../../lib/prisma";
import { EmployeeAsEnum, WhitelistStatus } from ".prisma/client";

@UseBeforeEach(IsAuth)
@Controller("/businesses/employees")
export class BusinessEmployeeController {
  @Put("/:businessId/:id")
  async updateEmployee(
    @PathParams("id") employeeId: string,
    @PathParams("businessId") businessId: string,
    @Context() ctx: Context,
    @BodyParams() body: JsonRequestBody,
  ) {
    const error = validate(UPDATE_EMPLOYEE_SCHEMA, body.toJSON(), true);

    if (error) {
      throw new BadRequest(error);
    }

    const employee = await prisma.employee.findFirst({
      where: {
        id: body.get("employeeId"),
        businessId,
        userId: ctx.get("user").id,
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
        id: body.get("roleId"),
      },
    });

    if (!role || role.as === EmployeeAsEnum.OWNER) {
      throw new BadRequest("cannotSetRoleToOwner");
    }

    const updated = await prisma.employee.update({
      where: {
        id: employeeToUpdate.id,
      },
      data: {
        employeeOfTheMonth: body.get("employeeOfTheMonth"),
        canCreatePosts: body.get("canCreatePosts"),
        roleId: body.get("roleId"),
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
    @Context() ctx: Context,
    @BodyParams() body: JsonRequestBody,
  ) {
    const error = validate(FIRE_EMPLOYEE_SCHEMA, body.toJSON(), true);

    if (error) {
      throw new BadRequest(error);
    }

    const employee = await prisma.employee.findFirst({
      where: {
        id: body.get("employeeId"),
        businessId,
        userId: ctx.get("user").id,
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
    @Context() ctx: Context,
    @BodyParams() body: JsonRequestBody,
  ) {
    const error = validate(FIRE_EMPLOYEE_SCHEMA, body.toJSON(), true);
    if (error) {
      throw new BadRequest(error);
    }

    const employee = await prisma.employee.findFirst({
      where: {
        id: body.get("employeeId"),
        businessId,
        userId: ctx.get("user").id,
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
