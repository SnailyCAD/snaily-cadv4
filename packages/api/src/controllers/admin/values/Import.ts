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
  DIVISION_ARR,
} from "@snailycad/schemas";
import type {
  DepartmentType,
  DriversLicenseCategoryType,
  EmployeeAsEnum,
  ShouldDoType,
  StatusValueType,
  ValueLicenseType,
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

    const handler = typeHandlers[type as keyof typeof typeHandlers];
    const data = await handler(body, type);
    return data;
  }

  private getTypeFromPath(path: string): ValueType {
    return path.replace("-", "_").toUpperCase() as ValueType;
  }
}

export const typeHandlers = {
  VEHICLE: async (body: unknown) => {
    const data = validateSchema(HASH_SCHEMA_ARR, body);

    return handlePromiseAll(data, async (item) => {
      return prisma.vehicleValue.create({
        include: { value: true },
        data: {
          hash: item.hash,
          value: createValueObj(item.value, ValueType.VEHICLE),
        },
      });
    });
  },
  WEAPON: async (body: unknown) => {
    const data = validateSchema(HASH_SCHEMA_ARR, body);

    return handlePromiseAll(data, async (item) => {
      return prisma.weaponValue.create({
        include: { value: true },
        data: {
          hash: item.hash,
          value: createValueObj(item.value, ValueType.WEAPON),
        },
      });
    });
  },
  BUSINESS_ROLE: async (body: unknown) => {
    const data = validateSchema(BUSINESS_ROLE_ARR, body);

    return handlePromiseAll(data, async (item) => {
      return prisma.employeeValue.create({
        data: {
          as: item.as as EmployeeAsEnum,
          value: createValueObj(item.value, ValueType.BUSINESS_ROLE),
        },
        include: { value: true },
      });
    });
  },
  DRIVERSLICENSE_CATEGORY: async (body: unknown) => {
    const data = validateSchema(DLC_ARR, body);

    return handlePromiseAll(data, async (item) => {
      return prisma.driversLicenseCategoryValue.create({
        data: {
          type: item.type as DriversLicenseCategoryType,
          value: createValueObj(item.value, ValueType.DRIVERSLICENSE_CATEGORY),
        },
        include: { value: true },
      });
    });
  },
  DEPARTMENT: async (body: unknown) => {
    const data = validateSchema(DEPARTMENT_ARR, body);

    return handlePromiseAll(data, async (item) => {
      return prisma.departmentValue.create({
        data: {
          type: item.type as DepartmentType,
          callsign: item.callsign,
          value: createValueObj(item.value, ValueType.DEPARTMENT),
          isDefaultDepartment: item.isDefaultDepartment ?? false,
          whitelisted: item.whitelisted ?? false,
        },
        include: { value: true },
      });
    });
  },
  DIVISION: async (body: unknown) => {
    const data = validateSchema(DIVISION_ARR, body);

    return handlePromiseAll(data, async (item) => {
      return prisma.divisionValue.create({
        data: {
          callsign: item.callsign,
          department: { connect: { id: item.departmentId } },
          value: createValueObj(item.value, ValueType.DIVISION),
        },
        include: { value: true, department: { include: { value: true } } },
      });
    });
  },
  CODES_10: async (body: unknown) => {
    const data = validateSchema(CODES_10_ARR, body);

    return handlePromiseAll(data, async (item) => {
      return prisma.statusValue.create({
        data: {
          type: item.type as StatusValueType,
          color: item.color,
          shouldDo: item.shouldDo as ShouldDoType,
          value: createValueObj(item.value, ValueType.CODES_10),
        },
        include: { value: true },
      });
    });
  },

  GENDER: async (body: unknown) => typeHandlers.GENERIC(body, "GENDER"),
  ETHNICITY: async (body: unknown) => typeHandlers.GENERIC(body, "ETHNICITY"),
  BLOOD_GROUP: async (body: unknown) => typeHandlers.GENERIC(body, "BLOOD_GROUP"),
  IMPOUND_LOT: async (body: unknown) => typeHandlers.GENERIC(body, "IMPOUND_LOT"),
  LICENSE: async (body: unknown) => typeHandlers.GENERIC(body, "LICENSE"),
  OFFICER_RANK: async (body: unknown) => typeHandlers.GENERIC(body, "OFFICER_RANK"),

  GENERIC: async (body: unknown, type: ValueType) => {
    const data = validateSchema(BASE_ARR, body);

    return handlePromiseAll(data, async (item) => {
      return prisma.value.create({
        data: {
          isDefault: false,
          type: type as ValueType,
          value: item.value,
          licenseType: type === "LICENSE" ? (item.licenseType as ValueLicenseType) : undefined,
        },
      });
    });
  },
};

function createValueObj(value: string, type: ValueType) {
  return {
    create: {
      isDefault: false,
      type,
      value,
    },
  };
}

async function handlePromiseAll<T, R>(
  data: T[],
  handler: (item: T) => Promise<R>,
): Promise<{ success: R[]; failed: number }> {
  let failed = 0;
  const success: R[] = [];

  await Promise.all(
    data.map(async (item) => {
      try {
        const data = await handler(item);
        success.push(data);
      } catch (e) {
        console.error(e);
        failed += 1;
      }
    }),
  );

  return { success, failed };
}
