import { Controller } from "@tsed/di";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { BodyParams, Context, PathParams, QueryParams } from "@tsed/platform-params";
import { ContentType, Delete, Description, Get, Hidden, Post, Put } from "@tsed/schema";
import { IsAuth } from "middlewares/is-auth";
import { NotFound } from "@tsed/exceptions";
import { prisma } from "lib/data/prisma";
import { type User, WhitelistStatus } from "@prisma/client";
import type * as APITypes from "@snailycad/types/api";
import { Feature, IsFeatureEnabled } from "middlewares/is-enabled";
import { validateSchema } from "lib/data/validate-schema";
import { BUSINESSES_BUSINESS_ROLE_SCHEMA } from "@snailycad/schemas";

@UseBeforeEach(IsAuth)
@Controller("/businesses/roles")
@Hidden()
@ContentType("application/json")
@IsFeatureEnabled({ feature: Feature.BUSINESS })
export class BusinessController {
  @Get("/:id")
  @Description("Get all business roles related to this business.")
  async getBusinessRoles(
    @Context("user") user: User,
    @PathParams("id") businessId: string,
    @QueryParams("employeeId") employeeId: string,
  ): Promise<APITypes.GetBusinessRolesByBusinessIdData> {
    const employee = await prisma.employee.findFirst({
      where: {
        id: String(employeeId),
        whitelistStatus: WhitelistStatus.ACCEPTED,
        userId: user.id,
      },
      include: { role: true },
    });

    if (!employee || employee.role?.as === "EMPLOYEE") {
      throw new NotFound("employeeNotFoundOrInvalidPermissions");
    }

    const [totalCount, roles] = await prisma.$transaction([
      prisma.employeeValue.count(),
      prisma.employeeValue.findMany({
        include: { value: true },
        where: {
          businesses: {
            some: { id: businessId },
          },
        },
      }),
    ]);

    return { totalCount, roles };
  }

  @Post("/:id")
  @Description("Create a business role related to this business.")
  async createBusinessRole(
    @Context("user") user: User,
    @PathParams("id") businessId: string,
    @QueryParams("employeeId") employeeId: string,
    @BodyParams() body: unknown,
  ) {
    const data = validateSchema(BUSINESSES_BUSINESS_ROLE_SCHEMA, body);

    const employee = await prisma.employee.findFirst({
      where: {
        id: String(employeeId),
        businessId,
        userId: user.id,
      },
      include: { role: true },
    });

    if (!employee || employee.role?.as === "EMPLOYEE") {
      throw new NotFound("employeeNotFoundOrInvalidPermissions");
    }

    const role = await prisma.employeeValue.create({
      data: {
        as: data.as as "MANAGER" | "EMPLOYEE",
        businesses: { connect: { id: businessId } },
        value: {
          create: {
            type: "BUSINESS_ROLE",
            value: data.value,
            isDefault: false,
          },
        },
      },
      include: { value: true },
    });

    return role;
  }

  @Put("/:id/:roleId")
  async updateBusinessRole(
    @Context("user") user: User,
    @PathParams("id") businessId: string,
    @PathParams("roleId") roleId: string,
    @QueryParams("employeeId") employeeId: string,
    @BodyParams() body: unknown,
  ) {
    const data = validateSchema(BUSINESSES_BUSINESS_ROLE_SCHEMA, body);

    const employee = await prisma.employee.findFirst({
      where: {
        id: String(employeeId),
        businessId,
        userId: user.id,
      },
      include: { role: true },
    });

    if (!employee || employee.role?.as === "EMPLOYEE") {
      throw new NotFound("employeeNotFoundOrInvalidPermissions");
    }

    const role = await prisma.employeeValue.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFound("roleNotFound");
    }

    const updatedRole = await prisma.employeeValue.update({
      where: { id: role.id },
      data: {
        as: data.as as "MANAGER" | "EMPLOYEE",
        value: {
          update: { value: data.value },
        },
      },
      include: { value: true },
    });

    return updatedRole;
  }

  @Delete("/:id/:roleId")
  async deleteBusinessRole(
    @Context("user") user: User,
    @PathParams("id") businessId: string,
    @PathParams("roleId") roleId: string,
    @QueryParams("employeeId") employeeId: string,
  ) {
    const employee = await prisma.employee.findFirst({
      where: {
        id: String(employeeId),
        businessId,
        userId: user.id,
      },
      include: { role: true },
    });

    if (!employee || employee.role?.as === "EMPLOYEE") {
      throw new NotFound("employeeNotFoundOrInvalidPermissions");
    }

    const role = await prisma.employeeValue.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFound("roleNotFound");
    }

    await prisma.employeeValue.delete({
      where: { id: role.id },
    });

    return true;
  }
}
