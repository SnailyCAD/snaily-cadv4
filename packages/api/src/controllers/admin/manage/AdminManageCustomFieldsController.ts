import { CustomFieldCategory, Rank } from "@prisma/client";
import { AuditLogActionType, createAuditLogEntry } from "@snailycad/audit-logger/server";
import { CUSTOM_FIELDS_SCHEMA } from "@snailycad/schemas";
import type { User } from "@snailycad/types";
import { BodyParams, Context, PathParams, UseBeforeEach } from "@tsed/common";
import { Controller } from "@tsed/di";
import { NotFound } from "@tsed/exceptions";
import { Delete, Description, Get, Post, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { validateSchema } from "lib/validateSchema";
import { IsAuth } from "middlewares/IsAuth";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";

@Controller("/admin/manage/custom-fields")
@UseBeforeEach(IsAuth)
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
  async createCustomField(@BodyParams() body: unknown, @Context("user") sessionUser: User) {
    const data = validateSchema(CUSTOM_FIELDS_SCHEMA, body);

    const customField = await prisma.customField.create({
      data: {
        category: data.category as CustomFieldCategory,
        name: data.name,
        citizenEditable: data.citizenEditable,
      },
    });

    await createAuditLogEntry({
      prisma,
      executorId: sessionUser.id,
      action: { type: AuditLogActionType.CustomFieldCreate, new: customField, previous: undefined },
      translationKey: "createdEntry",
    });

    return customField;
  }

  @Put("/:id")
  @Description("Update a custom field by its id")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageCustomFields],
  })
  async updateCustomField(
    @BodyParams() body: unknown,
    @PathParams("id") id: string,
    @Context("user") sessionUser: User,
  ) {
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

    await createAuditLogEntry({
      prisma,
      executorId: sessionUser.id,
      action: { type: AuditLogActionType.CustomFieldUpdate, new: updated, previous: customField },
    });

    return updated;
  }

  @Delete("/:id")
  @Description("Delete a custom field by its id")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageCustomFields],
  })
  async deleteCustomField(@PathParams("id") id: string, @Context("user") sessionUser: User) {
    const customField = await prisma.customField.findUnique({
      where: { id },
    });

    if (!customField) {
      throw new NotFound("customFieldNotFound");
    }

    await prisma.customField.delete({
      where: { id: customField.id },
    });

    await createAuditLogEntry({
      prisma,
      executorId: sessionUser.id,
      action: { type: AuditLogActionType.CustomFieldDelete, new: customField, previous: undefined },
      translationKey: "deletedEntry",
    });

    return true;
  }
}
