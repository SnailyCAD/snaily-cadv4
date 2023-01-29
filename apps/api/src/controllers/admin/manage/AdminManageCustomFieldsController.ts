import { CustomFieldCategory, Rank } from "@prisma/client";
import { AuditLogActionType, createAuditLogEntry } from "@snailycad/audit-logger/server";
import { CUSTOM_FIELDS_SCHEMA } from "@snailycad/schemas";
import { BodyParams, Context, PathParams, UseBeforeEach } from "@tsed/common";
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
  async createCustomField(
    @BodyParams() body: unknown,
    @Context("sessionUserId") sessionUserId: string,
  ) {
    const data = validateSchema(CUSTOM_FIELDS_SCHEMA, body);

    const customField = await prisma.customField.create({
      data: {
        category: data.category as CustomFieldCategory,
        name: data.name,
        citizenEditable: data.citizenEditable,
      },
    });

    await createAuditLogEntry({
      action: { type: AuditLogActionType.CustomFieldCreate, new: customField },
      prisma,
      executorId: sessionUserId,
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
    @Context("sessionUserId") sessionUserId: string,
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
      action: { type: AuditLogActionType.CustomFieldUpdate, previous: customField, new: updated },
      prisma,
      executorId: sessionUserId,
    });

    return updated;
  }

  @Delete("/:id")
  @Description("Delete a custom field by its id")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageCustomFields],
  })
  async deleteCustomField(
    @PathParams("id") id: string,
    @Context("sessionUserId") sessionUserId: string,
  ) {
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
      action: { type: AuditLogActionType.CustomFieldDelete, new: customField },
      prisma,
      executorId: sessionUserId,
    });

    return true;
  }
}
