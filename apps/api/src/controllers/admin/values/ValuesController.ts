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
import { prisma } from "lib/prisma";
import { IsValidPath, validValuePaths } from "middlewares/ValidPath";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { IsAuth } from "middlewares/IsAuth";
import { typeHandlers } from "./Import";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";
import { ValuesSelect, getTypeFromPath, getPermissionsForValuesRequest } from "lib/values/utils";
import { ValueType } from "@prisma/client";
import { UsePermissions } from "middlewares/UsePermissions";
import { AllowedFileExtension, allowedFileExtensions } from "@snailycad/config";
import type * as APITypes from "@snailycad/types/api";
import { getImageWebPPath } from "utils/image";
import { BULK_DELETE_SCHEMA } from "@snailycad/schemas";
import { validateSchema } from "lib/validateSchema";

const GET_VALUES: Partial<Record<ValueType, ValuesSelect>> = {
  QUALIFICATION: {
    name: "qualificationValue",
    include: { departments: { include: { value: true } } },
  },
  VEHICLE: { name: "vehicleValue" },
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
};

@Controller("/admin/values/:path")
@UseBeforeEach(IsAuth, IsValidPath)
@ContentType("application/json")
export class ValuesController {
  @Get("/")
  @Description("Get all the values by the specified types")
  async getValueByPath(
    @PathParams("path") path: (string & {}) | "all",
    @QueryParams("paths") rawPaths: string,
    @QueryParams("skip", Number) skip = 0,
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

        const data = GET_VALUES[type];
        if (data) {
          const [totalCount, values] = await prisma.$transaction([
            // @ts-expect-error ignore
            prisma[data.name].count({
              orderBy: { value: { position: "asc" } },
            }),
            // @ts-expect-error ignore
            prisma[data.name].findMany({
              include: {
                ...(data.include ?? {}),
                ...(type === "ADDRESS" ? {} : { _count: true }),
                value: true,
              },
              orderBy: { value: { position: "asc" } },
              take: 35,
              skip,
            }),
          ]);

          return {
            type,
            groups: [],
            values,
            totalCount,
          };
        }

        if (type === "PENAL_CODE") {
          return {
            type,
            groups: await prisma.penalCodeGroup.findMany({ orderBy: { position: "asc" } }),
            values: await prisma.penalCode.findMany({
              orderBy: { title: "asc" },
              include: {
                warningApplicable: true,
                warningNotApplicable: true,
                group: true,
              },
            }),
          };
        }

        return {
          type,
          groups: [],
          // todo: add counts
          values: await prisma.value.findMany({
            where: { type },
            orderBy: { position: "asc" },
            include: {
              _count: true,
              ...(type === ValueType.OFFICER_RANK
                ? { officerRankDepartments: { include: { value: true } } }
                : {}),
            },
          }),
        };
      }),
    );

    return values as APITypes.GetValuesData;
  }

  @Get("/search")
  async searchValues(@PathParams("path") path: string, @QueryParams("query") query: string) {
    const type = getTypeFromPath(path);
    const data = GET_VALUES[type];

    if (data) {
      let where: any = {
        value: { isDisabled: false, value: { contains: query, mode: "insensitive" } },
      };

      if (ValueType.ADDRESS === type) {
        where = {
          OR: [
            { value: { value: { contains: query, mode: "insensitive" } } },
            { county: { contains: query, mode: "insensitive" } },
            { postal: { contains: query, mode: "insensitive" } },
          ],
          AND: [{ value: { isDisabled: false } }],
        };
      }

      // @ts-expect-error ignore
      const values = await prisma[data.name].findMany({
        include: { ...(data.include ?? {}), value: true },
        orderBy: { value: { position: "asc" } },
        where,
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

    const image = await getImageWebPPath({ buffer: file.buffer, pathType: "values", id });

    await fs.writeFile(image.path, image.buffer);

    let data;
    if (type === ValueType.QUALIFICATION) {
      data = await prisma.qualificationValue.update({
        where: { id },
        data: { imageId: image.fileName },
        select: { imageId: true },
      });
    } else if (type === ValueType.OFFICER_RANK) {
      data = await prisma.value.update({
        where: { id },
        data: { officerRankImageId: image.fileName },
        select: { officerRankImageId: true },
      });
    }

    return data;
  }

  @Post("/")
  @Description("Create a new value by the specified type")
  @UsePermissions(getPermissionsForValuesRequest)
  async createValueByPath(
    @Context() context: Context,
    @BodyParams() body: any,
    @PathParams("path") path: string,
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

    return value as APITypes.PostValuesData;
  }

  @Delete("/bulk-delete")
  @Description("Bulk-delete values by the specified ids and type")
  @UsePermissions(getPermissionsForValuesRequest)
  async bulkDeleteByPathAndIds(
    @PathParams("path") path: string,
    @BodyParams() body: unknown,
  ): Promise<APITypes.DeleteValuesBulkData> {
    const type = getTypeFromPath(path);
    const data = validateSchema(BULK_DELETE_SCHEMA, body);

    const arr = await Promise.all(data.map(async (id) => this.deleteById(type, id)));

    return arr.every((v) => v);
  }

  @Delete("/:id")
  @Description("Delete a value by the specified type and id")
  @UsePermissions(getPermissionsForValuesRequest)
  async deleteValueByPathAndId(
    @PathParams("id") id: string,
    @PathParams("path") path: string,
  ): Promise<APITypes.DeleteValueByIdData> {
    const type = getTypeFromPath(path);
    return this.deleteById(type, id);
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

  private async deleteById(type: ValueType, id: string) {
    const data = GET_VALUES[type];

    if (data) {
      // @ts-expect-error ignore
      const deleted = await prisma[data.name].delete({
        where: {
          id,
        },
      });

      await prisma.value.delete({
        where: {
          id: deleted.valueId,
        },
      });

      return true;
    }

    if (type === "PENAL_CODE") {
      await prisma.penalCode.delete({
        where: {
          id,
        },
      });

      return true;
    }

    await prisma.value.delete({
      where: {
        id,
      },
    });

    return true;
  }
}
