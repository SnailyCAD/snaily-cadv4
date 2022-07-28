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
import { Delete, Get, Post, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { validateSchema } from "lib/validateSchema";
import { IsAuth } from "middlewares/IsAuth";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";
import { validateImgurURL } from "utils/image";
import fs from "node:fs/promises";
import process from "node:process";
import type * as APITypes from "@snailycad/types/api";
import { AuditLogActionType } from "@snailycad/audit-logger";
import { createAuditLogEntry } from "@snailycad/audit-logger/server";
import type { User } from "@snailycad/types";

@Controller("/admin/manage/custom-roles")
@UseBeforeEach(IsAuth)
export class AdminManageCustomRolesController {
  @Get("/")
  async getCustomRoles(): Promise<APITypes.GetCustomRolesData> {
    const roles = await prisma.customRole.findMany();
    return roles;
  }

  @Post("/")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageCustomRoles],
  })
  async createCustomRole(
    @BodyParams() body: unknown,
    @Context("user") sessionUser: User,
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
        iconId: validateImgurURL(data.icon),
        discordRoleId: data.discordRoleId,
      },
      include: { discordRole: true },
    });

    await createAuditLogEntry({
      prisma,
      executorId: sessionUser.id,
      action: { type: AuditLogActionType.CustomRoleCreate, new: customRole, previous: undefined },
      translationKey: "createdEntry",
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
    @Context("user") sessionUser: User,
  ): Promise<APITypes.PutCustomRoleByIdData> {
    const data = validateSchema(CUSTOM_ROLE_SCHEMA, body);

    const customRole = await prisma.customRole.findUnique({
      where: { id },
    });

    if (!customRole) {
      throw new NotFound("customRoleNotFound");
    }

    const updated = await prisma.customRole.update({
      where: { id: customRole.id },
      data: {
        name: data.name,
        permissions: data.permissions,
        iconId: validateImgurURL(data.icon),
        discordRoleId: data.discordRoleId,
      },
      include: { discordRole: true },
    });

    await createAuditLogEntry({
      prisma,
      executorId: sessionUser.id,
      action: { type: AuditLogActionType.CustomRoleUpdate, new: updated, previous: customRole },
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
    @Context("user") sessionUser: User,
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
      prisma,
      executorId: sessionUser.id,
      action: { type: AuditLogActionType.CustomRoleDelete, new: customRole, previous: undefined },
      translationKey: "deletedEntry",
    });

    return true;
  }

  @Post("/:id")
  async uploadImageToCustomRole(
    @PathParams("id") customRoleId: string,
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
        select: { iconId: true },
      }),
      fs.writeFile(path, file.buffer),
    ]);

    return data;
  }
}
