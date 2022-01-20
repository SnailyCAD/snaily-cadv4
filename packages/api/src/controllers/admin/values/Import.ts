import { ValueType } from ".prisma/client";
import {
  Controller,
  PathParams,
  UseBeforeEach,
  MultipartFile,
  PlatformMulterFile,
} from "@tsed/common";
import { Post } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { IsValidPath } from "middlewares/ValidPath";
import { BadRequest } from "@tsed/exceptions";
import { IsAuth } from "middlewares/index";

import {
  HASH_SCHEMA_ARR,
  BASE_ARR,
  BUSINESS_ROLE_ARR,
  DLC_ARR,
  DEPARTMENT_ARR,
  CODES_10_ARR,
} from "@snailycad/schemas";
import {
  DepartmentType,
  DriversLicenseCategoryType,
  EmployeeAsEnum,
  ShouldDoType,
  StatusValueType,
} from "@prisma/client";
import { validateSchema } from "lib/validateSchema";

@Controller("/admin/values/import/:path")
@UseBeforeEach(IsAuth, IsValidPath)
export class ValuesController {
  @Post("/")
  async patchValueByPathAndId(
    @MultipartFile("file") file: PlatformMulterFile,
    @PathParams("path") path: string,
  ) {
    const type = this.getTypeFromPath(path);

    if (file.mimetype !== "application/json") {
      throw new BadRequest("invalidImageType");
    }

    const rawBody = file.buffer.toString("utf8");
    let body = null;

    try {
      body = JSON.parse(rawBody);
    } catch {
      body = null;
    }

    if (!body) {
      throw new BadRequest("couldNotParseBody");
    }

    const handler = typeHandlers[type];
    const data = await handler?.(body);
    return data ?? [];
  }

  private getTypeFromPath(path: string): ValueType {
    return path.replace("-", "_").toUpperCase() as ValueType;
  }
}

// todo: use this in `ValuesController`
const typeHandlers: Partial<
  Record<ValueType | "GENERIC", (body: unknown, valueType?: ValueType) => Promise<any[]>>
> = {
  VEHICLE: async (body) => {
    const data = validateSchema(HASH_SCHEMA_ARR, body);

    return Promise.all(
      data.map(async (item) => {
        return prisma.vehicleValue.create({
          data: {
            hash: item.hash,
            value: {
              create: {
                isDefault: false,
                type: "VEHICLE",
                value: item.value,
              },
            },
          },
        });
      }),
    );
  },
  WEAPON: async (body) => {
    const data = validateSchema(HASH_SCHEMA_ARR, body);

    return Promise.all(
      data.map(async (item) => {
        return prisma.weaponValue.create({
          data: {
            hash: item.hash,
            value: {
              create: {
                isDefault: false,
                type: "WEAPON",
                value: item.value,
              },
            },
          },
        });
      }),
    );
  },
  BUSINESS_ROLE: async (body) => {
    const data = validateSchema(BUSINESS_ROLE_ARR, body);

    return Promise.all(
      data.map(async (item) => {
        return prisma.employeeValue.create({
          data: {
            as: item.as as EmployeeAsEnum,
            value: {
              create: {
                isDefault: false,
                type: "BUSINESS_ROLE",
                value: item.value,
              },
            },
          },
          include: { value: true },
        });
      }),
    );
  },
  DRIVERSLICENSE_CATEGORY: async (body) => {
    const data = validateSchema(DLC_ARR, body);

    return Promise.all(
      data.map(async (item) => {
        return prisma.driversLicenseCategoryValue.create({
          data: {
            type: item.type as DriversLicenseCategoryType,
            value: {
              create: {
                isDefault: false,
                type: "DRIVERSLICENSE_CATEGORY",
                value: item.value,
              },
            },
          },
          include: { value: true },
        });
      }),
    );
  },
  DEPARTMENT: async (body) => {
    const data = validateSchema(DEPARTMENT_ARR, body);

    return Promise.all(
      data.map(async (item) => {
        return prisma.departmentValue.create({
          data: {
            type: item.type as DepartmentType,
            callsign: item.callsign,
            value: {
              create: {
                isDefault: false,
                type: "DEPARTMENT",
                value: item.value,
              },
            },
          },
          include: { value: true },
        });
      }),
    );
  },
  CODES_10: async (body) => {
    const data = validateSchema(CODES_10_ARR, body);

    return Promise.all(
      data.map(async (item) => {
        return prisma.statusValue.create({
          data: {
            type: item.type as StatusValueType,
            color: item.color,
            shouldDo: item.shouldDo as ShouldDoType,
            value: {
              create: {
                isDefault: false,
                type: "CODES_10",
                value: item.value,
              },
            },
          },
          include: { value: true },
        });
      }),
    );
  },

  GENDER: async (body) => typeHandlers.GENERIC!(body, "GENDER"),
  ETHNICITY: async (body) => typeHandlers.GENERIC!(body, "ETHNICITY"),
  BLOOD_GROUP: async (body) => typeHandlers.GENERIC!(body, "BLOOD_GROUP"),
  IMPOUND_LOT: async (body) => typeHandlers.GENERIC!(body, "IMPOUND_LOT"),
  LICENSE: async (body) => typeHandlers.GENERIC!(body, "LICENSE"),
  OFFICER_RANK: async (body) => typeHandlers.GENERIC!(body, "OFFICER_RANK"),

  GENERIC: async (body, type) => {
    const data = validateSchema(BASE_ARR, body);

    return Promise.all(
      data.map(async (item) => {
        return prisma.value.create({
          data: {
            isDefault: false,
            type: type!,
            value: item.value,
          },
        });
      }),
    );
  },
};
