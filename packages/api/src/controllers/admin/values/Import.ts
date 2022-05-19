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
import { IsAuth } from "middlewares/IsAuth";

import {
  HASH_SCHEMA_ARR,
  BASE_ARR,
  BUSINESS_ROLE_ARR,
  DLC_ARR,
  DEPARTMENT_ARR,
  CODES_10_ARR,
  DIVISION_ARR,
  PENAL_CODE_ARR,
  QUALIFICATION_ARR,
} from "@snailycad/schemas";
import {
  type DepartmentType,
  type DriversLicenseCategoryType,
  type EmployeeAsEnum,
  type ShouldDoType,
  type StatusValueType,
  type ValueLicenseType,
  type QualificationValueType,
  WhatPages,
  ValueType,
  Value,
} from "@prisma/client";
import { validateSchema } from "lib/validateSchema";
import { upsertWarningApplicable } from "lib/records/penal-code";
import { getLastOfArray, manyToManyHelper } from "utils/manyToMany";
import { getPermissionsForValuesRequest } from "lib/values/utils";
import { UsePermissions } from "middlewares/UsePermissions";
import { validateImgurURL } from "utils/image";

@Controller("/admin/values/import/:path")
@UseBeforeEach(IsAuth, IsValidPath)
export class ImportValuesViaFileController {
  @Post("/")
  @UsePermissions(getPermissionsForValuesRequest)
  async importValueByPath(
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

    if (!Array.isArray(body)) {
      throw new BadRequest("Body must be an array");
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
  VEHICLE: async (body: unknown, id?: string) => {
    const data = validateSchema(HASH_SCHEMA_ARR, body);

    return prisma.$transaction(
      data.map((item) => {
        return prisma.vehicleValue.upsert({
          where: { id: String(id) },
          ...makePrismaData(ValueType.VEHICLE, {
            hash: item.hash,
            value: item.value,
          }),
          include: { value: true },
        });
      }),
    );
  },
  WEAPON: async (body: unknown, id?: string) => {
    const data = validateSchema(HASH_SCHEMA_ARR, body);

    return prisma.$transaction(
      data.map((item) => {
        return prisma.weaponValue.upsert({
          include: { value: true },
          where: { id: String(id) },
          ...makePrismaData(ValueType.WEAPON, {
            hash: item.hash,
            value: item.value,
          }),
        });
      }),
    );
  },
  BUSINESS_ROLE: async (body: unknown, id?: string) => {
    const data = validateSchema(BUSINESS_ROLE_ARR, body);

    return prisma.$transaction(
      data.map((item) => {
        return prisma.employeeValue.upsert({
          where: { id: String(id) },
          ...makePrismaData(ValueType.BUSINESS_ROLE, {
            as: item.as as EmployeeAsEnum,
            value: item.value,
          }),
          include: { value: true },
        });
      }),
    );
  },
  DRIVERSLICENSE_CATEGORY: async (body: unknown, id?: string) => {
    const data = validateSchema(DLC_ARR, body);

    return prisma.$transaction(
      data.map((item) => {
        return prisma.driversLicenseCategoryValue.upsert({
          where: { id: String(id) },
          ...makePrismaData(ValueType.DRIVERSLICENSE_CATEGORY, {
            type: item.type as DriversLicenseCategoryType,
            value: item.value,
            description: item.description,
          }),
          include: { value: true },
        });
      }),
    );
  },
  DEPARTMENT: async (body: unknown, id?: string) => {
    const data = validateSchema(DEPARTMENT_ARR, body);

    return prisma.$transaction(
      data.map((item) => {
        return prisma.departmentValue.upsert({
          where: { id: String(id) },
          ...makePrismaData(ValueType.DEPARTMENT, {
            type: item.type as DepartmentType,
            callsign: item.callsign,
            value: item.value,
            isDefaultDepartment: item.isDefaultDepartment ?? false,
            isConfidential: item.isConfidential ?? false,
            whitelisted: item.whitelisted ?? false,
            defaultOfficerRank: item.defaultOfficerRankId
              ? { connect: { id: item.defaultOfficerRankId } }
              : undefined,
          }),
          include: { value: true, defaultOfficerRank: true },
        });
      }),
    );
  },
  DIVISION: async (body: unknown, id?: string) => {
    const data = validateSchema(DIVISION_ARR, body);

    return prisma.$transaction(
      data.map((item) => {
        return prisma.divisionValue.upsert({
          where: { id: String(id) },
          ...makePrismaData(ValueType.DIVISION, {
            callsign: item.callsign,
            department: { connect: { id: item.departmentId } },
            value: item.value,
            pairedUnitTemplate: item.pairedUnitTemplate || null,
          }),
          include: { value: true, department: { include: { value: true } } },
        });
      }),
    );
  },
  CODES_10: async (body: unknown, id?: string) => {
    const data = validateSchema(CODES_10_ARR, body);
    const DEFAULT_WHAT_PAGES = [WhatPages.LEO, WhatPages.DISPATCH, WhatPages.EMS_FD];

    return handlePromiseAll(data, async (item) => {
      const whatPages = (item.whatPages?.length ?? 0) <= 0 ? DEFAULT_WHAT_PAGES : item.whatPages;

      const updatedValue = await prisma.statusValue.upsert({
        where: { id: String(id) },
        ...makePrismaData(ValueType.CODES_10, {
          type: item.type as StatusValueType,
          color: item.color,
          shouldDo: item.shouldDo as ShouldDoType,
          whatPages: whatPages as WhatPages[],
          value: item.value,
        }),
        include: { value: true, departments: { include: { value: true } } },
      });

      const disconnectConnectArr = manyToManyHelper(
        updatedValue.departments.map((v) => v.id),
        item.departments ?? [],
      );

      const updated = getLastOfArray(
        await prisma.$transaction(
          disconnectConnectArr.map((v, idx) =>
            prisma.statusValue.update({
              where: { id: updatedValue.id },
              data: { departments: v },
              include:
                idx + 1 === disconnectConnectArr.length
                  ? { value: true, departments: { include: { value: true } } }
                  : undefined,
            }),
          ),
        ),
      );

      return updated || updatedValue;
    });
  },
  PENAL_CODE: async (body: unknown, id?: string) => {
    const data = validateSchema(PENAL_CODE_ARR, body);
    const penalCode = id && (await prisma.penalCode.findUnique({ where: { id: String(id) } }));

    return handlePromiseAll(data, async (item) => {
      const data = {
        update: {
          title: item.title,
          description: item.description,
          descriptionData: item.descriptionData ?? [],
          groupId: item.groupId,
          ...(await upsertWarningApplicable(item, penalCode || undefined)),
        },
        create: {
          title: item.title,
          description: item.description,
          descriptionData: item.descriptionData ?? [],
          groupId: item.groupId,
          ...(await upsertWarningApplicable(item)),
        },
      };

      return prisma.penalCode.upsert({
        where: { id: String(id) },
        ...data,
        include: { warningApplicable: true, warningNotApplicable: true },
      });
    });
  },
  QUALIFICATION: async (body: unknown, id?: string) => {
    const data = validateSchema(QUALIFICATION_ARR, body);

    return handlePromiseAll(data, async (item) => {
      const updatedValue = await prisma.qualificationValue.upsert({
        where: { id: String(id) },
        ...makePrismaData(ValueType.QUALIFICATION, {
          description: item.description,
          imageId: validateImgurURL(item.image),
          value: item.value,
          qualificationType: item.qualificationType as QualificationValueType,
        }),
        include: { value: true, departments: { include: { value: true } } },
      });

      const disconnectConnectArr = manyToManyHelper(
        updatedValue.departments.map((v) => v.id),
        item.departments ?? [],
      );

      const updated = getLastOfArray(
        await prisma.$transaction(
          disconnectConnectArr.map((v, idx) =>
            prisma.qualificationValue.update({
              where: { id: updatedValue.id },
              data: { departments: v },
              include:
                idx + 1 === disconnectConnectArr.length
                  ? { value: true, departments: { include: { value: true } } }
                  : undefined,
            }),
          ),
        ),
      );

      return updated || updatedValue;
    });
  },

  OFFICER_RANK: async (body: unknown, id?: string) => {
    const data = validateSchema(BASE_ARR, body);

    return handlePromiseAll(data, async (item) => {
      const createUpdateData = {
        officerRankImageId: validateImgurURL(item.officerRankImageId),
        value: item.value,
        isDefault: false,
        type: ValueType.OFFICER_RANK,
      };

      const updatedValue = await prisma.value.upsert({
        where: { id: String(id) },
        create: createUpdateData,
        update: createUpdateData,
        include: { officerRankDepartments: true },
      });

      const disconnectConnectArr = manyToManyHelper(
        updatedValue.departments.map((v) => v.id),
        item.departments ?? [],
      );

      const updated = getLastOfArray(
        await prisma.$transaction(
          disconnectConnectArr.map((v, idx) =>
            prisma.value.update({
              where: { id: updatedValue.id },
              data: { departments: v },
              include:
                idx + 1 === disconnectConnectArr.length
                  ? { departments: { include: { value: true } } }
                  : undefined,
            }),
          ),
        ),
      );

      return updated || updatedValue;
    });
  },

  GENDER: async (body: unknown, id?: string) => typeHandlers.GENERIC(body, "GENDER", id),
  ETHNICITY: async (body: unknown, id?: string) => typeHandlers.GENERIC(body, "ETHNICITY", id),
  BLOOD_GROUP: async (body: unknown, id?: string) => typeHandlers.GENERIC(body, "BLOOD_GROUP", id),
  IMPOUND_LOT: async (body: unknown, id?: string) => typeHandlers.GENERIC(body, "IMPOUND_LOT", id),
  LICENSE: async (body: unknown, id?: string) => typeHandlers.GENERIC(body, "LICENSE", id),
  VEHICLE_FLAG: async (body: unknown, id?: string) =>
    typeHandlers.GENERIC(body, "VEHICLE_FLAG", id),
  CITIZEN_FLAG: async (body: unknown, id?: string) =>
    typeHandlers.GENERIC(body, "CITIZEN_FLAG", id),

  GENERIC: async (body: unknown, type: ValueType, id?: string): Promise<Value[]> => {
    const data = validateSchema(BASE_ARR, body);

    return prisma.$transaction(
      data.map((item) => {
        const data = {
          update: {
            isDefault: type === ValueType.LICENSE ? item.isDefault ?? false : false,
            type: type as ValueType,
            value: { set: item.value },
            licenseType:
              type === ValueType.LICENSE ? (item.licenseType as ValueLicenseType) : undefined,
            officerRankImageId:
              type === ValueType.OFFICER_RANK
                ? validateImgurURL(item.officerRankImageId)
                : undefined,
          },
          create: {
            isDefault: type === ValueType.LICENSE ? item.isDefault ?? false : false,
            type: type as ValueType,
            value: item.value,
            licenseType:
              type === ValueType.LICENSE ? (item.licenseType as ValueLicenseType) : undefined,
            officerRankImageId:
              type === ValueType.OFFICER_RANK
                ? validateImgurURL(item.officerRankImageId)
                : undefined,
          },
        };

        return prisma.value.upsert({
          where: { id: String(id) },
          ...data,
        });
      }),
    );
  },
};

function makePrismaData<T extends { value: string }>(type: ValueType, data: T) {
  const { value, ...rest } = data;

  return {
    update: { ...rest, value: createValueObj(value, type, "update") },
    create: { ...rest, value: createValueObj(value, type, "create") },
  };
}

function createValueObj(
  value: string,
  type: ValueType,
  updateType: "update" | "create" = "create",
) {
  return {
    [updateType]: {
      isDefault: false,
      type,
      value: updateType === "update" ? { set: value } : value,
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
