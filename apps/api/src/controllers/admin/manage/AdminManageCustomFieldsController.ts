import { CustomFieldCategory, Rank } from "@prisma/client";
import { CUSTOM_FIELDS_SCHEMA } from "@snailycad/schemas";
import { BodyParams, PathParams, UseBeforeEach } from "@tsed/common";
import { Controller } from "@tsed/di";
import { NotFound } from "@tsed/exceptions";
import { ContentType, Delete, Description, Get, Post, Put } from "@tsed/schema";
import { prisma } from "lib/data/prisma";
import { validateSchema } from "lib/data/validate-schema";
import { IsAuth } from "middlewares/is-auth";
import { UsePermissions, Permissions } from "middlewares/use-permissions";

@Controller("/admin/manage/custom-fields")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
export class AdminManageCustomFieldsController {
  @Get("/")
  @Description("Get all the custom fields within the CAD")
  async getCustomFields() {
    const fields = await prisma.customField.findMany();
    return fields;
  }

  @Post("/")
  @Description("Create a new custom field")
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
        citizenEditable: data.citizenEditable,
      },
    });

    return customField;
  }

  @Put("/:id")
  @Description("Update a custom field by its id")
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
        citizenEditable: data.citizenEditable,
      },
    });

    return updated;
  }

  @Delete("/:id")
  @Description("Delete a custom field by its id")
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
