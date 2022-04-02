import { CustomFieldCategory, Rank } from "@prisma/client";
import { CUSTOM_FIELDS_SCHEMA } from "@snailycad/schemas";
import { BodyParams, PathParams } from "@tsed/common";
import { Controller } from "@tsed/di";
import { NotFound } from "@tsed/exceptions";
import { Delete, Get, Post, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { validateSchema } from "lib/validateSchema";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";

@Controller("/admin/manage/custom-fields")
export class AdminManageCustomFieldsController {
  @Get("/")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageCustomFields, Permissions.ViewCustomFields],
  })
  async getCustomFields() {
    const fields = await prisma.customField.findMany();
    return fields;
  }

  @Post("/")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageCustomFields],
  })
  async createCustomField(@BodyParams() body: unknown) {
    const data = validateSchema(CUSTOM_FIELDS_SCHEMA, body);

    const customField = await prisma.customField.create({
      data: {
        category: data.category as CustomFieldCategory,
        name: data.name,
      },
    });

    return customField;
  }

  @Put("/:id")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageCustomFields],
  })
  async updateCustomField(@BodyParams() body: unknown, @PathParams("id") id: string) {
    const data = validateSchema(CUSTOM_FIELDS_SCHEMA, body);

    const customField = await prisma.customField.findUnique({
      where: { id },
    });

    if (!customField) {
      throw new NotFound("customFieldNotFound");
    }

    const updated = await prisma.customField.update({
      where: { id: customField.id },
      data: {
        category: data.category as CustomFieldCategory,
        name: data.name,
      },
    });

    return updated;
  }

  @Delete("/:id")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageCustomFields],
  })
  async deleteCustomField(@PathParams("id") id: string) {
    const customField = await prisma.customField.findUnique({
      where: { id },
    });

    if (!customField) {
      throw new NotFound("customFieldNotFound");
    }

    await prisma.customField.delete({
      where: { id: customField.id },
    });

    return true;
  }
}
