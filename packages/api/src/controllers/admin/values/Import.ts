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
  PENAL_CODE_ARR,
} from "@snailycad/schemas";
import {
  type DepartmentType,
  type DriversLicenseCategoryType,
  type EmployeeAsEnum,
  type ShouldDoType,
  type StatusValueType,
  type ValueLicenseType,
  WhatPages,
  ValueType,
  StatusValue,
} from "@prisma/client";
import { validateSchema } from "lib/validateSchema";
import { createWarningApplicable } from "lib/records/penal-code";

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
    const DEFAULT_WHAT_PAGES = [WhatPages.LEO, WhatPages.DISPATCH, WhatPages.EMS_FD];

    return handlePromiseAll(data, async (item) => {
      const whatPages = (item.whatPages?.length ?? 0) <= 0 ? DEFAULT_WHAT_PAGES : item.whatPages;

      const value = await prisma.statusValue.create({
        data: {
          type: item.type as StatusValueType,
          color: item.color,
          shouldDo: item.shouldDo as ShouldDoType,
          whatPages: whatPages as WhatPages[],
          value: createValueObj(item.value, ValueType.CODES_10),
        },
        include: { value: true },
      });

      let last: StatusValue | null = null;
      await Promise.all(
        (item.departments ?? []).map(async (departmentId, idx) => {
          const isLast = idx + 1 === item.departments?.length;
          const statusValue = await prisma.statusValue.update({
            where: { id: value.id },
            data: { departments: { connect: { id: departmentId } } },
            include: isLast
              ? { value: true, departments: { include: { value: true } } }
              : undefined,
          });

          if (isLast) {
            last = statusValue;
          }
        }),
      );

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      return { ...value, ...(last ?? {}) };
    });
  },
  PENAL_CODE: async (body: unknown) => {
    const data = validateSchema(PENAL_CODE_ARR, body);

    return handlePromiseAll(data, async (item) => {
      return prisma.penalCode.create({
        data: {
          title: item.title,
          description: item.description,
          descriptionData: item.descriptionData ?? [],
          groupId: item.groupId,
          ...(await createWarningApplicable(item)),
        },
        include: { warningApplicable: true, warningNotApplicable: true },
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
