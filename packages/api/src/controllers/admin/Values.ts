import { ValueType, PrismaClient } from ".prisma/client";
import { CREATE_PENAL_CODE_SCHEMA, validate, VALUE_SCHEMA } from "@snailycad/schemas";
import { Get, Controller, PathParams, UseBeforeEach, BodyParams, QueryParams } from "@tsed/common";
import { Delete, Description, JsonRequestBody, Patch, Post, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { IsValidPath } from "middlewares/ValidPath";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { IsAuth } from "middlewares/index";
import { typeHandlers } from "./values/Import";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";

export type NameType = Exclude<
  keyof PrismaClient,
  | "$use"
  | "$on"
  | "$connect"
  | "$disconnect"
  | "$executeRaw"
  | "$executeRawUnsafe"
  | "$queryRaw"
  | "$queryRawUnsafe"
  | "$transaction"
>;

const GET_VALUES: Partial<Record<ValueType, { name: NameType; include?: any }>> = {
  VEHICLE: { name: "vehicleValue" },
  WEAPON: { name: "weaponValue" },
  BUSINESS_ROLE: { name: "employeeValue" },
  CODES_10: { name: "statusValue" },
  DRIVERSLICENSE_CATEGORY: { name: "driversLicenseCategoryValue" },
  DEPARTMENT: { name: "departmentValue" },
  DIVISION: {
    name: "divisionValue",
    include: { discordRole: true, department: { include: { value: true } } },
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
    const [value] = arr.success;

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
    @BodyParams() body: JsonRequestBody,
    @PathParams("id") id: string,
    @PathParams("path") path: string,
  ) {
    const error = validate(VALUE_SCHEMA, body.toJSON(), true);
    const type = this.getTypeFromPath(path);

    if (error && !["PENAL_CODE"].includes(type)) {
      throw new BadRequest(error);
    }

    if (type === "PENAL_CODE") {
      const error = validate(CREATE_PENAL_CODE_SCHEMA, body.toJSON(), true);
      if (error) {
        throw new BadRequest(error);
      }

      const penalCode = await prisma.penalCode.findUnique({
        where: { id },
      });

      if (!penalCode) {
        throw new NotFound("penalCodeNotFound");
      }

      let warningId;
      if (body.get("warningApplicable")) {
        const fines = this.parsePenalCodeValues(body.get("fines"));

        const data = await prisma.warningApplicable.upsert({
          where: {
            id: penalCode.warningApplicableId ?? "null",
          },
          create: { fines },
          update: { fines },
        });

        warningId = data.id;
      } else {
        const fines = this.parsePenalCodeValues(body.get("fines"));
        const prisonTerm = this.parsePenalCodeValues(body.get("prisonTerm"));
        const bail = this.parsePenalCodeValues(body.get("prisonTerm"));

        const data = await prisma.warningNotApplicable.upsert({
          where: {
            id: penalCode.warningNotApplicableId ?? "null",
          },
          create: { fines, prisonTerm, bail },
          update: { fines, prisonTerm, bail },
        });

        warningId = data.id;
      }

      const key = body.get("warningApplicable") ? "warningApplicableId" : "warningNotApplicableId";
      const updated = await prisma.penalCode.update({
        where: { id },
        data: {
          title: body.get("title"),
          description: body.get("description"),
          descriptionData: body.descriptionData,
          groupId: body.get("groupId") || null,
          [key]: warningId,
        },
        include: {
          warningApplicable: true,
          warningNotApplicable: true,
        },
      });

      return updated;
    }

    if (type === "CODES_10") {
      const updated = await prisma.statusValue.update({
        where: {
          id,
        },
        data: {
          value: {
            update: {
              value: body.get("value"),
            },
          },
          whatPages: body.get("whatPages") ?? [],
          shouldDo: body.get("shouldDo"),
          color: body.get("color") || null,
          type: body.get("type") || "STATUS_CODE",
        },
        include: {
          value: true,
        },
      });

      return updated;
    }

    if (type === "DEPARTMENT") {
      if (body.get("isDefaultDepartment")) {
        const existing = await prisma.departmentValue.findFirst({
          where: { isDefaultDepartment: true },
        });

        if (existing && existing.id !== id) {
          throw new ExtendedBadRequest({
            isDefaultDepartment: "Only 1 department can be set a default.",
          });
        }
      }

      const updated = await prisma.departmentValue.update({
        where: {
          id,
        },
        data: {
          value: {
            update: {
              value: body.get("value"),
            },
          },
          isDefaultDepartment: body.get("whitelisted") ? false : body.get("isDefaultDepartment"),
          whitelisted: body.get("whitelisted"),
          callsign: body.get("callsign") || null,
          type: body.get("type"),
        },
        include: {
          value: true,
        },
      });

      return updated;
    }

    if (type === "DIVISION") {
      if (!body.get("departmentId")) {
        throw new BadRequest("departmentIdRequired");
      }

      const current = await prisma.divisionValue.findUnique({
        where: {
          id,
        },
        select: {
          departmentId: true,
          valueId: true,
        },
      });
      if (!current) {
        throw new NotFound("divisionNotFound");
      }

      const departmentId = body.get("departmentId");

      await prisma.value.update({
        where: {
          id: current.valueId,
        },
        data: {
          value: body.get("value"),
        },
      });

      const updated = await prisma.divisionValue.update({
        where: {
          id,
        },
        data: {
          callsign: body.get("callsign") || null,
          departmentId,
          discordRoleId: body.get("discordRoleId") || null,
        },
        include: {
          value: true,
          department: {
            include: {
              value: true,
            },
          },
        },
      });

      return updated;
    }

    if (type === "DRIVERSLICENSE_CATEGORY") {
      if (!body.get("type")) {
        throw new BadRequest("typeIsRequired");
      }

      const dlCategory = await prisma.driversLicenseCategoryValue.update({
        where: {
          id,
        },
        data: {
          value: {
            update: {
              value: body.get("value"),
            },
          },
        },
        include: { value: true },
      });

      return dlCategory;
    }

    if (type === "VEHICLE") {
      const vehicleValue = await prisma.vehicleValue.update({
        where: {
          id,
        },
        data: {
          value: {
            update: {
              value: body.get("value"),
            },
          },
          hash: body.get("hash") || null,
        },
        include: { value: true },
      });

      return vehicleValue;
    }

    if (type === "WEAPON") {
      const weaponValue = await prisma.weaponValue.update({
        where: {
          id,
        },
        data: {
          value: {
            update: {
              value: body.get("value"),
            },
          },
          hash: body.get("hash") || null,
        },
        include: { value: true },
      });

      return weaponValue;
    }

    const updated = await prisma.value.update({
      where: {
        id,
      },
      data: {
        value: body.get("value"),
        licenseType: type === "LICENSE" ? body.get("licenseType") : undefined,
      },
    });

    return updated;
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

  protected parsePenalCodeValues(arr: unknown): [number, number] | [] {
    if (!Array.isArray(arr)) {
      return [];
    }

    const [min, max] = arr;
    return [parseInt(min), parseInt(max)].filter(Boolean) as [number, number];
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
