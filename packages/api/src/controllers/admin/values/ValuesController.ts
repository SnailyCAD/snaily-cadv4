import {
  Get,
  Controller,
  PathParams,
  UseBeforeEach,
  BodyParams,
  QueryParams,
  MultipartFile,
  PlatformMulterFile,
} from "@tsed/common";
import process from "node:process";
import fs from "node:fs";
import { Delete, Description, Patch, Post, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { IsValidPath } from "middlewares/ValidPath";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { IsAuth } from "middlewares/IsAuth";
import { typeHandlers } from "./Import";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";
import { ValuesSelect, getTypeFromPath, getPermissionsForValuesRequest } from "lib/values/utils";
import { ValueType } from "@prisma/client";
import { UsePermissions } from "middlewares/UsePermissions";
import { AllowedFileExtension, allowedFileExtensions } from "@snailycad/config";

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
};

@Controller("/admin/values/:path")
@UseBeforeEach(IsAuth, IsValidPath)
export class ValuesController {
  @Get("/")
  @Description("Get all the values by the specified types")
  async getValueByPath(@PathParams("path") path: string, @QueryParams("paths") rawPaths: string) {
    // allow more paths in one request
    const paths =
      typeof rawPaths === "string" ? [...new Set([path, ...rawPaths.split(",")])] : [path];

    const values = await Promise.all(
      paths.map(async (path) => {
        const type = getTypeFromPath(path);

        const data = GET_VALUES[type];
        if (data) {
          return {
            type,
            // @ts-expect-error ignore
            values: await prisma[data.name].findMany({
              include: { ...(data.include ?? {}), value: true },
              orderBy: { value: { position: "asc" } },
            }),
          };
        }

        if (type === "PENAL_CODE") {
          return {
            type,
            groups: await prisma.penalCodeGroup.findMany({ orderBy: { position: "asc" } }),
            values: await prisma.penalCode.findMany({
              orderBy: { position: "asc" },
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
          values: await prisma.value.findMany({
            where: { type },
            orderBy: { position: "asc" },
            include:
              type === ValueType.OFFICER_RANK
                ? { officerRankDepartments: { include: { value: true } } }
                : undefined,
          }),
        };
      }),
    );

    return values;
  }

  @Get("/search")
  async searchValues(@PathParams("path") path: string, @QueryParams("query") query: string) {
    const type = getTypeFromPath(path);
    const data = GET_VALUES[type];

    if (data) {
      // @ts-expect-error ignore
      const values = await prisma[data.name].findMany({
        include: { ...(data.include ?? {}), value: true },
        orderBy: { value: { position: "asc" } },
        where: { value: { value: { contains: query, mode: "insensitive" } } },
      });

      return values;
    }

    const values = await prisma.value.findMany({
      where: { type, value: { contains: query, mode: "insensitive" } },
      orderBy: { position: "asc" },
    });

    return values;
  }

  @Post("/image/:id")
  async uploadImageToTypes(
    @PathParams("path") _path: string,
    @MultipartFile("image") file: PlatformMulterFile,
    @PathParams("id") id: string,
  ) {
    const type = getTypeFromPath(_path);
    const supportedValueTypes = [ValueType.QUALIFICATION, ValueType.OFFICER_RANK] as string[];

    if (!supportedValueTypes.includes(type)) {
      return new BadRequest("invalidType");
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

    // "image/png" -> "png"
    const extension = file.mimetype.split("/")[file.mimetype.split("/").length - 1];
    const path = `${process.cwd()}/public/values/${id}.${extension}`;

    await fs.writeFileSync(path, file.buffer);

    let data;
    if (type === ValueType.QUALIFICATION) {
      data = await prisma.qualificationValue.update({
        where: { id },
        data: { imageId: `${id}.${extension}` },
        select: { imageId: true },
      });
    } else if (type === ValueType.OFFICER_RANK) {
      data = await prisma.value.update({
        where: { id },
        data: { officerRankImageId: `${id}.${extension}` },
        select: { officerRankImageId: true },
      });
    }

    return data;
  }

  @Post("/")
  @Description("Create a new value by the specified type")
  @UsePermissions(getPermissionsForValuesRequest)
  async createValueByPath(@BodyParams() body: any, @PathParams("path") path: string) {
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
    const arr = await handler([body]);
    const [value] = "success" in arr ? arr.success : arr;

    return value;
  }

  @Delete("/bulk-delete")
  @Description("Bulk-delete values by the specified ids and type")
  @UsePermissions(getPermissionsForValuesRequest)
  async bulkDeleteByPathAndIds(@PathParams("path") path: string, @BodyParams() body: any) {
    const type = getTypeFromPath(path);
    const ids = body as string[];

    const arr = await Promise.all(ids.map(async (id) => this.deleteById(type, id)));

    return arr.every((v) => v);
  }

  @Delete("/:id")
  @Description("Delete a value by the specified type and id")
  @UsePermissions(getPermissionsForValuesRequest)
  async deleteValueByPathAndId(@PathParams("id") id: string, @PathParams("path") path: string) {
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
  ) {
    const type = getTypeFromPath(path);

    const handler = typeHandlers[type];
    const arr = await handler([body], valueId);
    const [value] = "success" in arr ? arr.success : arr;

    return value;
  }

  @Put("/positions")
  @Description("Update the positions of the values by the specified type")
  @UsePermissions(getPermissionsForValuesRequest)
  async updatePositions(
    @PathParams("path") path: ValueType,
    @BodyParams() body: { ids: string[] },
  ) {
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
  }

  protected async deleteById(type: ValueType, id: string) {
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
