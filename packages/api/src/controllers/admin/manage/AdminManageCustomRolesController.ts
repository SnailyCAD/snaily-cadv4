import { Rank } from "@prisma/client";
import { AllowedFileExtension, allowedFileExtensions } from "@snailycad/config";
import { CUSTOM_ROLE_SCHEMA } from "@snailycad/schemas";
import {
  BodyParams,
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
import fs from "node:fs";
import process from "node:process";

@Controller("/admin/manage/custom-roles")
@UseBeforeEach(IsAuth)
export class AdminManageCustomRolesController {
  @Get("/")
  async getCustomRoles() {
    const roles = await prisma.customRole.findMany();
    return roles;
  }

  @Post("/")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageCustomRoles],
  })
  async createCustomRole(@BodyParams() body: unknown) {
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
        icon: validateImgurURL(data.icon),
      },
    });

    return customRole;
  }

  @Put("/:id")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageCustomRoles],
  })
  async updateCustomRole(@BodyParams() body: unknown, @PathParams("id") id: string) {
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
        icon: validateImgurURL(data.icon),
      },
    });

    return updated;
  }

  @Delete("/:id")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageCustomRoles],
  })
  async deleteCustomRole(@PathParams("id") id: string) {
    const customRole = await prisma.customRole.findUnique({
      where: { id },
    });

    if (!customRole) {
      throw new NotFound("customRoleNotFound");
    }

    await prisma.customRole.delete({
      where: { id: customRole.id },
    });

    return true;
  }

  @Post("/:id")
  async uploadImageToCustomRole(
    @PathParams("id") customRoleId: string,
    @MultipartFile("image") file: PlatformMulterFile,
  ) {
    const customRole = await prisma.customRole.findUnique({
      where: {
        id: customRoleId,
      },
    });

    if (!customRole) {
      throw new NotFound("customRoleNotFound");
    }

    if (!allowedFileExtensions.includes(file.mimetype as AllowedFileExtension)) {
      throw new ExtendedBadRequest({ image: "invalidImageType" });
    }

    // "image/png" -> "png"
    const extension = file.mimetype.split("/")[file.mimetype.split("/").length - 1];
    const path = `${process.cwd()}/public/values/${customRole.id}.${extension}`;

    await fs.writeFileSync(path, file.buffer);

    const data = await prisma.customRole.update({
      where: { id: customRole.id },
      data: { icon: `${customRole.id}.${extension}` },
      select: { icon: true },
    });

    return data;
  }
}
