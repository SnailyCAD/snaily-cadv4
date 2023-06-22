import { prisma } from "lib/data/prisma";
import { type User, WhitelistStatus } from "@prisma/client";
import type * as APITypes from "@snailycad/types/api";
import { Feature, IsFeatureEnabled } from "middlewares/is-enabled";
import { validateSchema } from "lib/data/validate-schema";
import { BUSINESSES_BUSINESS_ROLE_SCHEMA } from "@snailycad/schemas";
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "~/middlewares/auth/is-auth";
import { Description } from "~/decorators/description";
import { SessionUser } from "~/decorators/user";

@UseGuards(AuthGuard)
@Controller("/businesses/roles")
@IsFeatureEnabled({ feature: Feature.BUSINESS })
export class BusinessRolesController {
  @Get("/:id")
  @Description("Get all business roles related to this business.")
  async getBusinessRoles(
    @SessionUser() user: User,
    @Param("id") businessId: string,
    @Query("employeeId") employeeId: string,
  ): Promise<APITypes.GetBusinessRolesByBusinessIdData> {
    const employee = await prisma.employee.findFirst({
      where: {
        id: String(employeeId),
        whitelistStatus: WhitelistStatus.ACCEPTED,
        userId: user.id,
      },
      include: { role: true },
    });

    const isOwner = employee?.role?.as === "OWNER";
    if (!employee || !isOwner) {
      throw new NotFoundException("employeeNotFoundOrInvalidPermissions");
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
    @SessionUser() user: User,
    @Param("id") businessId: string,
    @Query("employeeId") employeeId: string,
    @Body() body: unknown,
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

    const isOwner = employee?.role?.as === "OWNER";
    if (!employee || !isOwner) {
      throw new NotFoundException("employeeNotFoundOrInvalidPermissions");
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
    @SessionUser() user: User,
    @Param("id") businessId: string,
    @Param("roleId") roleId: string,
    @Query("employeeId") employeeId: string,
    @Body() body: unknown,
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

    const isOwner = employee?.role?.as === "OWNER";
    if (!employee || !isOwner) {
      throw new NotFoundException("employeeNotFoundOrInvalidPermissions");
    }

    const role = await prisma.employeeValue.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException("roleNotFound");
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
    @SessionUser() user: User,
    @Param("id") businessId: string,
    @Param("roleId") roleId: string,
    @Query("employeeId") employeeId: string,
  ) {
    const employee = await prisma.employee.findFirst({
      where: {
        id: String(employeeId),
        businessId,
        userId: user.id,
      },
      include: { role: true },
    });

    const isOwner = employee?.role?.as === "OWNER";
    if (!employee || !isOwner) {
      throw new NotFoundException("employeeNotFoundOrInvalidPermissions");
    }

    const role = await prisma.employeeValue.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException("roleNotFound");
    }

    await prisma.employeeValue.delete({
      where: { id: role.id },
    });

    return true;
  }
}
