import { ValueType } from ".prisma/client";
import { CODES_10_SCHEMA } from "@snailycad/schemas";
import { Get, Controller, PathParams, UseBeforeEach, BodyParams, QueryParams } from "@tsed/common";
import { Delete, Description, JsonRequestBody, Patch, Post, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { IsValidPath } from "middlewares/ValidPath";
import { BadRequest } from "@tsed/exceptions";
import { IsAuth } from "middlewares/index";
import { typeHandlers } from "./values/Import";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";
import type { ValuesSelect } from "lib/values/types";
import { validateSchema } from "lib/validateSchema";
import type { ShouldDoType, StatusValueType } from "@prisma/client";

const GET_VALUES: Partial<Record<ValueType, ValuesSelect>> = {
  VEHICLE: { name: "vehicleValue" },
  WEAPON: { name: "weaponValue" },
  BUSINESS_ROLE: { name: "employeeValue" },
  CODES_10: { name: "statusValue", include: { departments: { include: { value: true } } } },
  DRIVERSLICENSE_CATEGORY: { name: "driversLicenseCategoryValue" },
  DEPARTMENT: { name: "departmentValue" },
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
        const type = this.getTypeFromPath(path);

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
          }),
        };
      }),
    );

    return values;
  }

  @Post("/")
  @Description("Create a new value by the specified type")
  async createValueByPath(@BodyParams() body: any, @PathParams("path") path: string) {
    const type = this.getTypeFromPath(path);

    if (type === "DEPARTMENT") {
      if (body.isDefaultDepartment) {
        const existing = await prisma.departmentValue.findFirst({
          where: { isDefaultDepartment: true },
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
  async bulkDeleteByPathAndIds(@PathParams("path") path: string, @BodyParams() body: any) {
    const type = this.getTypeFromPath(path);
    const ids = body as string[];

    const arr = await Promise.all(
      ids.map(async (id) => {
        return this.deleteById(type, id);
      }),
    );

    return arr.every((v) => v);
  }

  @Delete("/:id")
  @Description("Delete a value by the specified type and id")
  async deleteValueByPathAndId(@PathParams("id") id: string, @PathParams("path") path: string) {
    const type = this.getTypeFromPath(path);
    return this.deleteById(type, id);
  }

  @Patch("/:id")
  @Description("Update a value by the specified type and id")
  async patchValueByPathAndId(
    @BodyParams() body: unknown,
    @PathParams("id") valueId: string,
    @PathParams("path") path: string,
  ) {
    const type = this.getTypeFromPath(path);

    if (type === ValueType.CODES_10) {
      const data = validateSchema(CODES_10_SCHEMA, body);

      const statusValue = await prisma.statusValue.findUnique({
        where: { id: valueId },
        include: { departments: true },
      });

      await Promise.all(
        (statusValue?.departments ?? []).map(async (v) => {
          await prisma.statusValue.update({
            where: { id: valueId },
            data: { departments: { disconnect: { id: v.id } } },
          });
        }),
      );

      await prisma.statusValue.update({
        where: {
          id: valueId,
        },
        data: {
          value: { update: { value: data.value } },
          whatPages: data.whatPages ?? [],
          shouldDo: data.shouldDo as ShouldDoType,
          color: data.color || null,
          type: (data.type as StatusValueType | null) ?? "STATUS_CODE",
        },
      });

      await Promise.all(
        (data.departments ?? []).map(async (departmentId: string) => {
          await prisma.statusValue.update({
            where: { id: valueId },
            data: { departments: { connect: { id: departmentId } } },
          });
        }),
      );

      const updated = await prisma.statusValue.findUnique({
        where: { id: valueId },
        include: { value: true, departments: { include: { value: true } } },
      });

      return updated;
    }

    const handler = typeHandlers[type];
    const arr = await handler([body], valueId);
    const [value] = "success" in arr ? arr.success : arr;

    return value;
  }

  @Put("/positions")
  @Description("Update the positions of the values by the specified type")
  async updatePositions(@PathParams("path") path: ValueType, @BodyParams() body: JsonRequestBody) {
    const type = this.getTypeFromPath(path);
    const ids = body.get("ids");

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

  protected getTypeFromPath(path: string): ValueType {
    return path.replace("-", "_").toUpperCase() as ValueType;
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
