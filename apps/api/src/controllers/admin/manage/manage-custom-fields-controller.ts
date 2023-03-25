import { CustomFieldCategory, Prisma, Rank } from "@prisma/client";
import { AuditLogActionType, createAuditLogEntry } from "@snailycad/audit-logger/server";
import { CUSTOM_FIELDS_SCHEMA } from "@snailycad/schemas";
import { BodyParams, Context, PathParams, QueryParams, UseBeforeEach } from "@tsed/common";
import { Controller } from "@tsed/di";
import { NotFound } from "@tsed/exceptions";
import { ContentType, Delete, Description, Get, Post, Put } from "@tsed/schema";
import { prisma } from "lib/data/prisma";
import { validateSchema } from "lib/data/validate-schema";
import { IsAuth } from "middlewares/is-auth";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import type * as APITypes from "@snailycad/types/api";

@Controller("/admin/manage/custom-fields")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
export class AdminManageCustomFieldsController {
  @Get("/")
  @Description("Get all the custom fields within the CAD")
  async getCustomFields(
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("includeAll", Boolean) includeAll = false,
    @QueryParams("query", String) query = "",
  ): Promise<APITypes.GetManageCustomFieldsData> {
    const where = query
      ? ({
          OR: [{ name: { contains: query, mode: "insensitive" } }],
        } satisfies Prisma.CustomFieldWhereInput)
      : undefined;

    const [totalCount, customFields] = await prisma.$transaction([
      prisma.customField.count({ where }),
      prisma.customField.findMany({
        take: includeAll ? undefined : 35,
        skip: includeAll ? undefined : skip,
        where,
      }),
    ]);

    return { customFields, totalCount };
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
  ): Promise<APITypes.PostManageCustomFieldsData> {
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
  ): Promise<APITypes.PutManageCustomFieldsData> {
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
  ): Promise<APITypes.DeleteManageCustomFieldsData> {
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
