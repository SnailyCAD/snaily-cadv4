import { Rank } from "@prisma/client";
import { AllowedFileExtension, allowedFileExtensions } from "@snailycad/config";
import { CUSTOM_ROLE_SCHEMA } from "@snailycad/schemas";
import {
  BodyParams,
  Context,
  MultipartFile,
  PathParams,
  PlatformMulterFile,
  UseBeforeEach,
} from "@tsed/common";
import { Controller } from "@tsed/di";
import { NotFound } from "@tsed/exceptions";
import { ContentType, Delete, Get, Post, Put } from "@tsed/schema";
import { prisma } from "lib/data/prisma";
import { validateSchema } from "lib/data/validate-schema";
import { IsAuth } from "middlewares/is-auth";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import { ExtendedBadRequest } from "src/exceptions/extended-bad-request";
import { validateImageURL } from "lib/images/validate-image-url";
import fs from "node:fs/promises";
import process from "node:process";
import type * as APITypes from "@snailycad/types/api";
import { AuditLogActionType, createAuditLogEntry } from "@snailycad/audit-logger/server";

@Controller("/admin/manage/custom-roles")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
export class AdminManageCustomRolesController {
  @Get("/")
  async getCustomRoles(): Promise<APITypes.GetCustomRolesData> {
    const roles = await prisma.customRole.findMany({ include: { discordRole: true } });
    return roles;
  }

  @Post("/")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageCustomRoles],
  })
  async createCustomRole(
    @BodyParams() body: unknown,
    @Context("sessionUserId") sessionUserId: string,
  ): Promise<APITypes.PostCustomRolesData> {
    const data = validateSchema(CUSTOM_ROLE_SCHEMA, body);

    const existing = await prisma.customRole.findFirst({
      where: { name: { equals: data.name, mode: "insensitive" } },
    });

    if (existing) {
      throw new ExtendedBadRequest({ name: "A custom role already exists with this name." });
    }

    const customRole = await prisma.customRole.create({
      data: {
        name: data.name,
        permissions: data.permissions,
        iconId: validateImageURL(data.icon),
        discordRoleId: data.discordRoleId,
      },
      include: { discordRole: true },
    });

    await createAuditLogEntry({
      action: { type: AuditLogActionType.CustomRoleCreate, new: customRole },
      prisma,
      executorId: sessionUserId,
    });

    return customRole;
  }

  @Put("/:id")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageCustomRoles],
  })
  async updateCustomRole(
    @BodyParams() body: unknown,
    @PathParams("id") id: string,
    @Context("sessionUserId") sessionUserId: string,
  ): Promise<APITypes.PutCustomRoleByIdData> {
    const data = validateSchema(CUSTOM_ROLE_SCHEMA, body);

    const customRole = await prisma.customRole.findUnique({
      where: { id },
      include: { discordRole: true },
    });

    if (!customRole) {
      throw new NotFound("customRoleNotFound");
    }

    const updated = await prisma.customRole.update({
      where: { id: customRole.id },
      data: {
        name: data.name,
        permissions: data.permissions,
        iconId: validateImageURL(data.icon),
        discordRoleId: data.discordRoleId,
      },
      include: { discordRole: true },
    });

    await createAuditLogEntry({
      action: { type: AuditLogActionType.CustomRoleUpdate, previous: customRole, new: updated },
      prisma,
      executorId: sessionUserId,
    });

    return updated;
  }

  @Delete("/:id")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageCustomRoles],
  })
  async deleteCustomRole(
    @PathParams("id") id: string,
    @Context("sessionUserId") sessionUserId: string,
  ): Promise<APITypes.DeleteCustomRoleByIdData> {
    const customRole = await prisma.customRole.findUnique({
      where: { id },
    });

    if (!customRole) {
      throw new NotFound("customRoleNotFound");
    }

    await prisma.customRole.delete({
      where: { id: customRole.id },
    });

    await createAuditLogEntry({
      action: { type: AuditLogActionType.CustomRoleDelete, new: customRole },
      prisma,
      executorId: sessionUserId,
    });

    return true;
  }

  @Post("/:id")
  async uploadImageToCustomRole(
    @PathParams("id") customRoleId: string,
    @Context("sessionUserId") sessionUserId: string,
    @MultipartFile("image") file?: PlatformMulterFile,
  ): Promise<APITypes.PostCustomRoleByIdData> {
    const customRole = await prisma.customRole.findUnique({
      where: {
        id: customRoleId,
      },
    });

    if (!customRole) {
      throw new NotFound("customRoleNotFound");
    }

    if (!file) {
      throw new ExtendedBadRequest({ file: "No file provided." });
    }

    if (!allowedFileExtensions.includes(file.mimetype as AllowedFileExtension)) {
      throw new ExtendedBadRequest({ image: "invalidImageType" });
    }

    // "image/png" -> "png"
    const extension = file.mimetype.split("/")[file.mimetype.split("/").length - 1];
    const path = `${process.cwd()}/public/values/${customRole.id}.${extension}`;

    const [data] = await Promise.all([
      prisma.customRole.update({
        where: { id: customRole.id },
        data: { iconId: `${customRole.id}.${extension}` },
      }),
      fs.writeFile(path, file.buffer),
    ]);

    await createAuditLogEntry({
      action: { type: AuditLogActionType.CustomRoleUpdate, previous: customRole, new: data },
      prisma,
      executorId: sessionUserId,
    });

    return data;
  }
}
