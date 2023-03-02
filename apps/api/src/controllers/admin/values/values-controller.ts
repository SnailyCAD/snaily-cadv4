import {
  Get,
  Controller,
  PathParams,
  UseBeforeEach,
  BodyParams,
  QueryParams,
  MultipartFile,
  PlatformMulterFile,
  Context,
} from "@tsed/common";
import fs from "node:fs/promises";
import { ContentType, Delete, Description, Patch, Post, Put } from "@tsed/schema";
import { prisma } from "lib/data/prisma";
import { IsValidPath, validValuePaths } from "middlewares/valid-path";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { IsAuth } from "middlewares/is-auth";
import { typeHandlers } from "./Import";
import { ExtendedBadRequest } from "src/exceptions/extended-bad-request";
import { ValuesSelect, getTypeFromPath, getPermissionsForValuesRequest } from "lib/values/utils";
import { ValueType } from "@prisma/client";
import { UsePermissions } from "middlewares/use-permissions";
import { AllowedFileExtension, allowedFileExtensions } from "@snailycad/config";
import type * as APITypes from "@snailycad/types/api";
import { getImageWebPPath } from "lib/images/get-image-webp-path";
import { BULK_DELETE_SCHEMA } from "@snailycad/schemas";
import { validateSchema } from "lib/data/validate-schema";
import { createSearchWhereObject } from "lib/values/create-where-object";
import generateBlurPlaceholder from "lib/images/generate-image-blur-data";
import { AuditLogActionType, createAuditLogEntry } from "@snailycad/audit-logger/server";

export const GET_VALUES: Partial<Record<ValueType, ValuesSelect>> = {
  QUALIFICATION: {
    name: "qualificationValue",
    include: { departments: { include: { value: true } } },
  },
  VEHICLE: { name: "vehicleValue", include: { trimLevels: true } },
  WEAPON: { name: "weaponValue" },
  BUSINESS_ROLE: { name: "employeeValue" },
  CODES_10: { name: "statusValue", include: { departments: { include: { value: true } } } },
  DRIVERSLICENSE_CATEGORY: { name: "driversLicenseCategoryValue" },
  DEPARTMENT: { name: "departmentValue", include: { defaultOfficerRank: true } },
  DIVISION: {
    name: "divisionValue",
    include: { department: { include: { value: true } } },
  },
  CALL_TYPE: { name: "callTypeValue" },
  ADDRESS: { name: "addressValue" },
  EMERGENCY_VEHICLE: {
    name: "emergencyVehicleValue",
    include: {
      value: true,
      departments: { include: { value: true } },
      divisions: { include: { value: true } },
    },
  },
};

@Controller("/admin/values/:path")
@UseBeforeEach(IsAuth, IsValidPath)
@ContentType("application/json")
export class ValuesController {
  @Get("/")
  @Description("Get all the values by the specified types")
  async getValueByPath(
    @PathParams("path") path: (string & {}) | "all",
    @QueryParams() queryParams: any,
    @QueryParams("paths") rawPaths: string,
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("query", String) query = "",
    @QueryParams("includeAll", Boolean) includeAll = true,
  ): Promise<APITypes.GetValuesData | APITypes.GetValuesPenalCodesData> {
    // allow more paths in one request
    let paths =
      typeof rawPaths === "string" ? [...new Set([path, ...rawPaths.split(",")])] : [path];

    if (path === "all") {
      paths = validValuePaths.filter((v) => v !== "penal_code_group");
    }

    const values = await Promise.all(
      paths.map(async (path) => {
        const type = getTypeFromPath(path) as ValueType;

        // @ts-expect-error ignore this is safe.
        if (type === "PENAL_CODE_GROUP") {
          throw new BadRequest(
            "`penal_code_group` must use the `/v1/admin/penal-code-group` API route (POST, PUT, DELETE).",
          );
        }

        const where = createSearchWhereObject({
          path,
          query,
          queryParams,
          showDisabled: true,
        });

        const data = GET_VALUES[type];
        if (data) {
          const [totalCount, values] = await prisma.$transaction([
            // @ts-expect-error ignore
            prisma[data.name].count({ orderBy: { value: { position: "asc" } }, where }),
            // @ts-expect-error ignore
            prisma[data.name].findMany({
              where,
              include: {
                ...(data.include ?? {}),
                ...(type === "ADDRESS" ? {} : { _count: true }),
                value: true,
              },
              orderBy: { value: { position: "asc" } },
              take: includeAll ? undefined : 35,
              skip: includeAll ? undefined : skip,
            }),
          ]);

          return {
            type,
            values,
            totalCount,
          };
        }

        if (type === "PENAL_CODE") {
          const [totalCount, penalCodes] = await prisma.$transaction([
            prisma.penalCode.count({
              where,
              orderBy: { title: "asc" },
            }),
            prisma.penalCode.findMany({
              take: includeAll ? undefined : 35,
              skip: includeAll ? undefined : skip,
              where,
              orderBy: { title: "asc" },
              include: {
                warningApplicable: true,
                warningNotApplicable: true,
                group: true,
              },
            }),
          ]);

          return {
            type,
            values: penalCodes,
            totalCount,
          };
        }

        const [totalCount, values] = await prisma.$transaction([
          prisma.value.count({ where, orderBy: { position: "asc" } }),
          prisma.value.findMany({
            where,
            take: includeAll ? undefined : 35,
            skip: includeAll ? undefined : skip,
            orderBy: { position: "asc" },
            include: {
              _count: true,
              ...(type === ValueType.OFFICER_RANK
                ? { officerRankDepartments: { include: { value: true } } }
                : {}),
            },
          }),
        ]);

        return {
          type,
          values,
          totalCount,
        };
      }),
    );

    return values as APITypes.GetValuesData;
  }

  @Get("/export")
  async exportValues(@PathParams("path") path: string): Promise<APITypes.GetValuesExportData> {
    const type = getTypeFromPath(path) as ValueType;

    // @ts-expect-error ignore this is safe.
    if (type === "PENAL_CODE_GROUP") {
      throw new BadRequest(
        "`penal_code_group` must use the `/v1/admin/penal-code-group` API route (POST, PUT, DELETE).",
      );
    }

    const data = GET_VALUES[type];
    if (data) {
      // @ts-expect-error ignore
      const values = await prisma[data.name].findMany({
        include: {
          ...(data.include ?? {}),
          value: true,
        },
        orderBy: { value: { position: "asc" } },
      });

      return values;
    }

    if (type === "PENAL_CODE") {
      const penalCodes = await prisma.penalCode.findMany({
        orderBy: { title: "asc" },
        include: { warningApplicable: true, warningNotApplicable: true, group: true },
      });

      return penalCodes;
    }

    const values = prisma.value.findMany({
      orderBy: { position: "asc" },
      where: { type },
    });

    return values;
  }

  @Get("/search")
  async searchValues(
    @PathParams("path") path: string,
    @QueryParams("query") query: string,
    @QueryParams() queryParams: any,
  ) {
    const type = getTypeFromPath(path);
    const data = GET_VALUES[type];

    if (data) {
      // @ts-expect-error ignore
      const values = await prisma[data.name].findMany({
        include: { ...(data.include ?? {}), value: true },
        orderBy: { value: { position: "asc" } },
        where: createSearchWhereObject({
          path,
          query,
          queryParams,
          showDisabled: false,
        }),
        take: 35,
      });

      return values;
    }

    const values = await prisma.value.findMany({
      where: { type, isDisabled: false, value: { contains: query, mode: "insensitive" } },
      orderBy: { position: "asc" },
      take: 35,
    });

    return values;
  }

  @Post("/image/:id")
  async uploadImageToTypes(
    @PathParams("path") _path: string,
    @PathParams("id") id: string,
    @MultipartFile("image") file?: PlatformMulterFile,
  ) {
    try {
      const type = getTypeFromPath(_path);
      const supportedValueTypes = [ValueType.QUALIFICATION, ValueType.OFFICER_RANK] as string[];

      if (!supportedValueTypes.includes(type)) {
        return new BadRequest("invalidType");
      }

      if (!file) {
        throw new ExtendedBadRequest({ file: "No file provided." });
      }

      if (!allowedFileExtensions.includes(file.mimetype as AllowedFileExtension)) {
        throw new ExtendedBadRequest({ image: "invalidImageType" });
      }

      if (type === ValueType.QUALIFICATION) {
        const value = await prisma.qualificationValue.findUnique({
          where: { id },
        });

        if (!value) {
          throw new NotFound("valueNotFound");
        }
      } else if (type === ValueType.OFFICER_RANK) {
        const value = await prisma.value.findFirst({
          where: { id, type: ValueType.OFFICER_RANK },
        });

        if (!value) {
          throw new NotFound("valueNotFound");
        }
      }

      const image = await getImageWebPPath({
        buffer: file.buffer,
        pathType: "values",
        id: `${id}-${file.originalname.split(".")[0]}`,
      });

      const blurData = await generateBlurPlaceholder(image);

      await fs.writeFile(image.path, image.buffer);

      let data;

      if (type === ValueType.QUALIFICATION) {
        data = await prisma.qualificationValue.update({
          where: { id },
          data: { imageId: image.fileName, imageBlurData: blurData },
          select: { imageId: true },
        });
      } else if (type === ValueType.OFFICER_RANK) {
        data = await prisma.value.update({
          where: { id },
          data: { officerRankImageId: image.fileName, officerRankImageBlurData: blurData },
          select: { officerRankImageId: true },
        });
      }

      return data;
    } catch {
      throw new BadRequest("errorUploadingImage");
    }
  }

  @Post("/")
  @Description("Create a new value by the specified type")
  @UsePermissions(getPermissionsForValuesRequest)
  async createValueByPath(
    @Context() context: Context,
    @BodyParams() body: any,
    @PathParams("path") path: string,
    @Context("sessionUserId") sessionUserId: string,
  ): Promise<APITypes.PostValuesData> {
    const type = getTypeFromPath(path);

    if (type === ValueType.DEPARTMENT) {
      if (body.isDefaultDepartment) {
        const existing = await prisma.departmentValue.findFirst({
          where: { isDefaultDepartment: true, type: body.type },
        });

        if (existing) {
          throw new ExtendedBadRequest({
            isDefaultDepartment: "Only 1 department can be set a default.",
          });
        }
      }
    }

    const handler = typeHandlers[type];
    const [value] = await handler({ body: [body], context });

    await createAuditLogEntry({
      translationKey: "createdEntry",
      action: { type: AuditLogActionType.ValueAdd, new: value },
      prisma,
      executorId: sessionUserId,
    });

    return value as APITypes.PostValuesData;
  }

  @Delete("/bulk-delete")
  @Description("Bulk-delete values by the specified ids and type")
  @UsePermissions(getPermissionsForValuesRequest)
  async bulkDeleteByPathAndIds(
    @PathParams("path") path: string,
    @Context("sessionUserId") sessionUserId: string,
    @BodyParams() body: unknown,
  ): Promise<APITypes.DeleteValuesBulkData> {
    const type = getTypeFromPath(path);
    const data = validateSchema(BULK_DELETE_SCHEMA, body);

    let arr = [];

    if (typeof data === "object" && "all" in data) {
      const data = GET_VALUES[type];
      const values: { id: string }[] = data
        ? // @ts-expect-error ignore
          await prisma[data.name].findMany({ select: { id: true } })
        : await prisma.value.findMany({ where: { type }, select: { id: true } });

      arr = await Promise.all(values.map(async (item) => this.deleteById(type, item.id)));
    } else {
      arr = await Promise.all(data.map(async (id) => this.deleteById(type, id)));
    }

    const successfullyDeleted = arr.filter((v) => v !== false) as string[];
    const successfullyDeletedCount = successfullyDeleted.length;

    const failedToDeleteCount = arr.filter((v) => v === false).length;

    await createAuditLogEntry({
      translationKey: "bulkRemoveValues",
      action: { type: AuditLogActionType.ValueBulkRemove, new: successfullyDeleted },
      prisma,
      executorId: sessionUserId,
    });

    return { success: successfullyDeletedCount, failed: failedToDeleteCount };
  }

  @Delete("/:id")
  @Description("Delete a value by the specified type and id")
  @UsePermissions(getPermissionsForValuesRequest)
  async deleteValueByPathAndId(
    @PathParams("id") id: string,
    @PathParams("path") path: string,
    @Context("sessionUserId") sessionUserId: string,
  ): Promise<APITypes.DeleteValueByIdData> {
    const type = getTypeFromPath(path);
    return !!this.deleteById(type, id, sessionUserId);
  }

  @Patch("/:id")
  @Description("Update a value by the specified type and id")
  @UsePermissions(getPermissionsForValuesRequest)
  async patchValueByPathAndId(
    @BodyParams() body: unknown,
    @PathParams("id") valueId: string,
    @PathParams("path") path: string,
    @Context() context: Context,
  ): Promise<APITypes.PatchValueByIdData> {
    const type = getTypeFromPath(path);

    const handler = typeHandlers[type];
    const [value] = await handler({ body: [body], id: valueId, context });

    return value as APITypes.PatchValueByIdData;
  }

  @Put("/positions")
  @Description("Update the positions of the values by the specified type")
  @UsePermissions(getPermissionsForValuesRequest)
  async updatePositions(
    @PathParams("path") path: ValueType,
    @BodyParams() body: { ids: string[] },
  ): Promise<APITypes.PutValuePositionsData> {
    const type = getTypeFromPath(path);
    const ids = body.ids;

    if (!Array.isArray(ids)) {
      throw new BadRequest("mustBeArray");
    }

    await Promise.all(
      ids.map(async (id: string, idx) => {
        const keyMap = new Map([
          ["PENAL_CODE", "penalCode"],
          ["PENAL_CODE_GROUP", "penalCodeGroup"],
        ]);

        const key = keyMap.has(type) ? keyMap.get(type) : "value";

        // @ts-expect-error shortcut
        await prisma[key].update({
          where: {
            id,
          },
          data: {
            position: idx,
          },
        });
      }),
    );

    return true;
  }

  private async deleteById(
    type: ValueType,
    id: string,
    sessionUserId?: string,
  ): Promise<string | false> {
    try {
      const data = GET_VALUES[type];

      if (data) {
        // @ts-expect-error ignore
        const deleted = await prisma[data.name].delete({ where: { id } });
        await prisma.value.delete({ where: { id: deleted.valueId } });

        if (sessionUserId) {
          await createAuditLogEntry({
            translationKey: "deletedEntry",
            action: { type: AuditLogActionType.ValueAdd, new: deleted },
            prisma,
            executorId: sessionUserId,
          });
        }

        return id;
      }

      if (type === "PENAL_CODE") {
        await prisma.penalCode.delete({ where: { id } });
        return id;
      }

      const value = await prisma.value.delete({ where: { id } });

      if (sessionUserId) {
        await createAuditLogEntry({
          translationKey: "deletedEntry",
          action: { type: AuditLogActionType.ValueAdd, new: value },
          prisma,
          executorId: sessionUserId,
        });
      }

      return id;
    } catch {
      return false;
    }
  }
}
