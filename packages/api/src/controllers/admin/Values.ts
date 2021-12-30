import { ValueType, PrismaClient } from ".prisma/client";
import { CREATE_PENAL_CODE_SCHEMA, validate, VALUE_SCHEMA } from "@snailycad/schemas";
import { Get, Controller, PathParams, UseBeforeEach, BodyParams, QueryParams } from "@tsed/common";
import { Delete, JsonRequestBody, Patch, Post, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { IsValidPath } from "middlewares/ValidPath";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { IsAuth } from "middlewares/index";

type NameType = Exclude<
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
    include: { department: { include: { value: true } } },
  },
};

@Controller("/admin/values/:path")
@UseBeforeEach(IsAuth, IsValidPath)
export class ValuesController {
  @Get("/")
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
            groups: await prisma.penalCodeGroup.findMany(),
            values: await prisma.penalCode.findMany({
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
            where: {
              type,
            },
            orderBy: {
              position: "asc",
            },
          }),
        };
      }),
    );

    return values;
  }

  @Post("/")
  async createValueByPath(@BodyParams() body: JsonRequestBody, @PathParams("path") path: string) {
    const type = this.getTypeFromPath(path);

    if (type === "PENAL_CODE") {
      const error = validate(CREATE_PENAL_CODE_SCHEMA, body.toJSON(), true);

      if (error) {
        throw new BadRequest(error);
      }

      let id;
      if (body.get("warningApplicable")) {
        const fines = this.parsePenalCodeValues(body.get("fines"));

        const data = await prisma.warningApplicable.create({
          data: {
            fines,
          },
        });

        id = data.id;
      } else {
        const fines = this.parsePenalCodeValues(body.get("fines"));
        const prisonTerm = this.parsePenalCodeValues(body.get("prisonTerm"));
        const bail = this.parsePenalCodeValues(body.get("bail"));

        const data = await prisma.warningNotApplicable.create({
          data: {
            fines,
            prisonTerm,
            bail,
          },
        });

        id = data.id;
      }

      const key = body.get("warningApplicable") ? "warningApplicableId" : "warningNotApplicableId";
      const code = await prisma.penalCode.create({
        data: {
          title: body.get("title"),
          description: body.get("description"),
          groupId: body.get("groupId") || null,
          [key]: id,
        },
        include: {
          warningApplicable: true,
          warningNotApplicable: true,
        },
      });

      return code;
    }

    const error = validate(VALUE_SCHEMA, body.toJSON(), true);

    if (error) {
      throw new BadRequest(error);
    }

    const value = await prisma.value.create({
      data: {
        type,
        value: body.get("value"),
        isDefault: false,
      },
    });

    if (type === "DRIVERSLICENSE_CATEGORY") {
      if (!body.get("type")) {
        throw new BadRequest("typeIsRequired");
      }

      const dlCategory = await prisma.driversLicenseCategoryValue.create({
        data: {
          type: body.get("type"),
          valueId: value.id,
        },
        include: { value: true },
      });

      return dlCategory;
    }

    if (type === "CODES_10") {
      if (!body.get("shouldDo")) {
        throw new BadRequest("codes10FieldsRequired");
      }

      const status = await prisma.statusValue.create({
        data: {
          whatPages: body.get("whatPages") ?? [],
          shouldDo: body.get("shouldDo"),
          valueId: value.id,
          color: body.get("color") || null,
          type: body.get("type") || "STATUS_CODE",
        },
        include: {
          value: true,
        },
      });

      return status;
    }

    if (type === "BUSINESS_ROLE") {
      if (!body.get("as")) {
        throw new BadRequest("asRequired");
      }

      await prisma.employeeValue.create({
        data: {
          as: body.get("as"),
          valueId: value.id,
        },
      });
    }

    if (type === "VEHICLE") {
      const vehicleValue = await prisma.vehicleValue.create({
        data: {
          valueId: value.id,
          hash: body.get("hash") || null,
        },
        include: { value: true },
      });

      return vehicleValue;
    }

    if (type === "WEAPON") {
      const weaponValue = await prisma.weaponValue.create({
        data: {
          valueId: value.id,
          hash: body.get("hash") || null,
        },
        include: { value: true },
      });

      return weaponValue;
    }

    if (type === "DIVISION") {
      if (!body.get("departmentId")) {
        throw new BadRequest("departmentIdRequired");
      }

      const division = await prisma.divisionValue.create({
        data: {
          valueId: value.id,
          callsign: body.get("callsign") || null,
          departmentId: body.get("departmentId"),
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

      return division;
    }

    if (type === "DEPARTMENT") {
      const department = await prisma.departmentValue.create({
        data: {
          valueId: value.id,
          callsign: body.get("callsign") || null,
          type: body.get("type"),
        },
        include: {
          value: true,
        },
      });

      return department;
    }

    return value;
  }

  @Delete("/:id")
  async deleteValueByPathAndId(@PathParams("id") id: string, @PathParams("path") path: string) {
    const type = this.getTypeFromPath(path);

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

  @Patch("/:id")
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
        },
      });
      if (!current) {
        throw new NotFound("divisionNotFound");
      }

      const departmentId = body.get("departmentId");
      const department = !current.departmentId
        ? { connect: { id: departmentId } }
        : { update: { id: body.get("departmentId") } };

      const updated = await prisma.divisionValue.update({
        where: {
          id,
        },
        data: {
          callsign: body.get("callsign") || null,
          department,
          value: {
            update: {
              value: body.get("value"),
            },
          },
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
      },
    });

    return updated;
  }

  @Put("/positions")
  async updatePositions(@BodyParams() body: JsonRequestBody) {
    const ids = body.get("ids");

    if (!Array.isArray(ids)) {
      throw new BadRequest("mustBeArray");
    }

    await Promise.all(
      ids.map(async (id: string, idx) => {
        await prisma.value.update({
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

  private getTypeFromPath(path: string): ValueType {
    return path.replace("-", "_").toUpperCase() as ValueType;
  }

  private parsePenalCodeValues(arr: unknown): [number, number] | [] {
    if (!Array.isArray(arr)) {
      return [];
    }

    const [min, max] = arr;
    return [parseInt(min), parseInt(max)].filter(Boolean) as [number, number];
  }
}
