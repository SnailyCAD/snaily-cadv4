import {
  Controller,
  PathParams,
  UseBeforeEach,
  MultipartFile,
  PlatformMulterFile,
  Context,
} from "@tsed/common";
import { ContentType, Post } from "@tsed/schema";
import { prisma } from "lib/data/prisma";
import { IsValidPath } from "middlewares/valid-path";
import { BadRequest } from "@tsed/exceptions";
import { IsAuth } from "middlewares/is-auth";

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
  CALL_TYPE_ARR,
  ADDRESS_SCHEMA_ARR,
  EMERGENCY_VEHICLE_ARR,
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
  cad,
  PenalCodeType,
  Feature,
} from "@prisma/client";
import { validateSchema } from "lib/data/validate-schema";
import { upsertWarningApplicable } from "lib/records/penal-code";
import { getLastOfArray, manyToManyHelper } from "lib/data/many-to-many";
import { getPermissionsForValuesRequest } from "lib/values/utils";
import { UsePermissions } from "middlewares/use-permissions";
import { validateImageURL } from "lib/images/validate-image-url";
import type * as APITypes from "@snailycad/types/api";
import { ExtendedBadRequest } from "src/exceptions/extended-bad-request";
import generateBlurPlaceholder from "lib/images/generate-image-blur-data";

@Controller("/admin/values/import/:path")
@UseBeforeEach(IsAuth, IsValidPath)
@ContentType("application/json")
export class ImportValuesViaFileController {
  @Post("/")
  @UsePermissions(getPermissionsForValuesRequest)
  async importValueByPath(
    @PathParams("path") path: string,
    @Context() context: Context,
    @MultipartFile("file") file?: PlatformMulterFile,
  ): Promise<APITypes.ImportValuesData> {
    const type = this.getTypeFromPath(path);

    if (!file) {
      throw new ExtendedBadRequest({ file: "No file provided." });
    }

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
    const data = await handler({ body, context, type });
    return data as APITypes.ImportValuesData;
  }

  private getTypeFromPath(path: string): ValueType {
    return path.replace(/-/g, "_").toUpperCase() as ValueType;
  }
}

interface HandlerOptions {
  body: unknown;
  id?: string;
  context: Context;
}

export const typeHandlers = {
  ADDRESS: async ({ body, id }: HandlerOptions) => {
    const data = validateSchema(ADDRESS_SCHEMA_ARR, body);

    return prisma.$transaction(
      data.map((item) => {
        return prisma.addressValue.upsert({
          where: { id: String(id) },
          ...makePrismaData(ValueType.ADDRESS, {
            postal: item.postal,
            county: item.county,
            value: item.value,
            isDisabled: item.isDisabled,
          }),
          include: { value: true },
        });
      }),
    );
  },
  VEHICLE: async ({ body, id }: HandlerOptions) => {
    const data = validateSchema(HASH_SCHEMA_ARR, body);

    return handlePromiseAll(data, async (item) => {
      const updatedValue = await prisma.vehicleValue.upsert({
        where: { id: String(id) },
        ...makePrismaData(ValueType.VEHICLE, {
          hash: item.hash,
          value: item.value,
          isDisabled: item.isDisabled,
        }),
        include: { value: true, trimLevels: true },
      });

      const disconnectConnectArr = manyToManyHelper(
        updatedValue.trimLevels.map((v) => v.id),
        item.trimLevels ?? [],
      );

      const updated = getLastOfArray(
        await prisma.$transaction(
          disconnectConnectArr.map((v, idx) =>
            prisma.vehicleValue.update({
              where: { id: updatedValue.id },
              data: { trimLevels: v },
              include:
                idx + 1 === disconnectConnectArr.length
                  ? { value: true, trimLevels: true }
                  : undefined,
            }),
          ),
        ),
      );

      return updated || updatedValue;
    });
  },
  WEAPON: async ({ body, id }: HandlerOptions) => {
    const data = validateSchema(HASH_SCHEMA_ARR, body);

    return prisma.$transaction(
      data.map((item) => {
        return prisma.weaponValue.upsert({
          include: { value: true },
          where: { id: String(id) },
          ...makePrismaData(ValueType.WEAPON, {
            hash: item.hash,
            value: item.value,
            isDisabled: item.isDisabled,
          }),
        });
      }),
    );
  },
  BUSINESS_ROLE: async ({ body, id }: HandlerOptions) => {
    const data = validateSchema(BUSINESS_ROLE_ARR, body);

    return prisma.$transaction(
      data.map((item) => {
        return prisma.employeeValue.upsert({
          where: { id: String(id) },
          ...makePrismaData(ValueType.BUSINESS_ROLE, {
            as: item.as as EmployeeAsEnum,
            value: item.value,
            isDisabled: item.isDisabled,
          }),
          include: { value: true },
        });
      }),
    );
  },
  DRIVERSLICENSE_CATEGORY: async ({ body, id }: HandlerOptions) => {
    const data = validateSchema(DLC_ARR, body);

    return prisma.$transaction(
      data.map((item) => {
        return prisma.driversLicenseCategoryValue.upsert({
          where: { id: String(id) },
          ...makePrismaData(ValueType.DRIVERSLICENSE_CATEGORY, {
            type: item.type as DriversLicenseCategoryType,
            value: item.value,
            isDisabled: item.isDisabled,
            description: item.description,
          }),
          include: { value: true },
        });
      }),
    );
  },
  DEPARTMENT: async ({ body, id }: HandlerOptions) => {
    const data = validateSchema(DEPARTMENT_ARR, body);

    return prisma.$transaction(
      data.map((item) => {
        return prisma.departmentValue.upsert({
          where: { id: String(id) },
          ...makePrismaData(ValueType.DEPARTMENT, {
            type: item.type as DepartmentType,
            callsign: item.callsign,
            value: item.value,
            isDisabled: item.isDisabled,
            isDefaultDepartment: item.isDefaultDepartment ?? false,
            isConfidential: item.isConfidential ?? false,
            whitelisted: item.whitelisted ?? false,
            extraFields: item.extraFields || undefined,
            defaultOfficerRank: item.defaultOfficerRankId
              ? { connect: { id: item.defaultOfficerRankId } }
              : undefined,
          }),
          include: { value: true, defaultOfficerRank: true },
        });
      }),
    );
  },
  DIVISION: async ({ body, id }: HandlerOptions) => {
    const data = validateSchema(DIVISION_ARR, body);

    return prisma.$transaction(
      data.map((item) => {
        return prisma.divisionValue.upsert({
          where: { id: String(id) },
          ...makePrismaData(ValueType.DIVISION, {
            callsign: item.callsign,
            department: { connect: { id: item.departmentId } },
            value: item.value,
            isDisabled: item.isDisabled,
            pairedUnitTemplate: item.pairedUnitTemplate || null,
            extraFields: item.extraFields || undefined,
          }),
          include: { value: true, department: { include: { value: true } } },
        });
      }),
    );
  },
  CODES_10: async ({ body, id }: HandlerOptions) => {
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
          isDisabled: item.isDisabled,
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
  PENAL_CODE: async ({ body, id, context }: HandlerOptions) => {
    const data = validateSchema(PENAL_CODE_ARR, body);
    const penalCode = id && (await prisma.penalCode.findUnique({ where: { id: String(id) } }));
    const cad = context.get("cad") as cad & { features?: Record<Feature, boolean> };

    const groups = new Map<string, { name: string; id: string; position: number | null }>();

    for (const item of data) {
      if (!item.group) continue;
      groups.set(item.group.id, item.group);
    }

    await Promise.all(
      Array.from(groups.values()).map(async (group) => {
        await prisma.penalCodeGroup.upsert({
          where: { id: group.id },
          update: { id: group.id, name: group.name, position: group.position },
          create: { id: group.id, name: group.name, position: group.position },
        });
      }),
    );

    return handlePromiseAll(data, async (item) => {
      const groupId = item.group?.id ?? item.groupId;

      const data = {
        update: {
          title: item.title,
          description: item.description,
          descriptionData: item.descriptionData ?? [],
          type: (item.type ?? null) as PenalCodeType | null,
          groupId,
          isPrimary: item.isPrimary ?? true,
          ...(await upsertWarningApplicable({
            body: item,
            cad,
            penalCode: penalCode || undefined,
          })),
        },
        create: {
          title: item.title,
          description: item.description,
          descriptionData: item.descriptionData ?? [],
          groupId,
          isPrimary: item.isPrimary ?? true,
          type: (item.type ?? null) as PenalCodeType | null,
          ...(await upsertWarningApplicable({
            body: item,
            cad,
          })),
        },
      };

      return prisma.penalCode.upsert({
        where: { id: String(id) },
        ...data,
        include: { warningApplicable: true, warningNotApplicable: true },
      });
    });
  },
  QUALIFICATION: async ({ body, id }: HandlerOptions) => {
    const data = validateSchema(QUALIFICATION_ARR, body);

    return handlePromiseAll(data, async (item) => {
      const validatedImageURL = validateImageURL(item.image);
      const updatedValue = await prisma.qualificationValue.upsert({
        where: { id: String(id) },
        ...makePrismaData(ValueType.QUALIFICATION, {
          description: item.description,
          imageId: validatedImageURL,
          imageBlurData: await generateBlurPlaceholder(validatedImageURL),
          value: item.value,
          isDisabled: item.isDisabled,
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

  OFFICER_RANK: async ({ body, id }: HandlerOptions) => {
    const data = validateSchema(BASE_ARR, body);

    return handlePromiseAll(data, async (item) => {
      const validatedImageURL = validateImageURL(item.officerRankImageId);
      const createUpdateData = {
        officerRankImageId: validatedImageURL,
        officerRankImageBlurData: await generateBlurPlaceholder(validatedImageURL),
        value: item.value,
        isDisabled: item.isDisabled ?? false,
        isDefault: false,
        type: ValueType.OFFICER_RANK,
      };

      const updatedValue = await prisma.value.upsert({
        where: { id: String(id) },
        create: createUpdateData,
        update: createUpdateData,
        include: { officerRankDepartments: { include: { value: true } } },
      });

      const disconnectConnectArr = manyToManyHelper(
        updatedValue.officerRankDepartments.map((v) => v.id),
        item.officerRankDepartments ?? [],
      );

      const updated = getLastOfArray(
        await prisma.$transaction(
          disconnectConnectArr.map((v, idx) =>
            prisma.value.update({
              where: { id: updatedValue.id },
              data: { officerRankDepartments: v },
              include:
                idx + 1 === disconnectConnectArr.length
                  ? { officerRankDepartments: { include: { value: true } } }
                  : undefined,
            }),
          ),
        ),
      );

      return updated || updatedValue;
    });
  },
  CALL_TYPE: async ({ body, id }: HandlerOptions) => {
    const data = validateSchema(CALL_TYPE_ARR, body);

    return prisma.$transaction(
      data.map((item) => {
        return prisma.callTypeValue.upsert({
          include: { value: true },
          where: { id: String(id) },
          ...makePrismaData(ValueType.CALL_TYPE, {
            priority: item.priority,
            value: item.value,
            isDisabled: item.isDisabled,
          }),
        });
      }),
    );
  },
  EMERGENCY_VEHICLE: async ({ body, id }: HandlerOptions) => {
    const data = validateSchema(EMERGENCY_VEHICLE_ARR, body);

    const valueInclude = {
      value: true,
      divisions: { include: { value: true } },
      departments: { include: { value: true } },
    };

    return handlePromiseAll(data, async (item) => {
      const updatedValue = await prisma.emergencyVehicleValue.upsert({
        where: { id: String(id) },
        ...makePrismaData(ValueType.EMERGENCY_VEHICLE, {
          value: item.value,
          isDisabled: item.isDisabled,
        }),
        include: valueInclude,
      });

      const departmentDcArr = manyToManyHelper(
        updatedValue.departments.map((v) => v.id),
        item.departments ?? [],
      );

      const divisionsDcArr = manyToManyHelper(
        updatedValue.divisions.map((v) => v.id),
        item.divisions ?? [],
      );

      const updatedWithDepartment = getLastOfArray(
        await prisma.$transaction(
          departmentDcArr.map((v, idx) =>
            prisma.emergencyVehicleValue.update({
              where: { id: updatedValue.id },
              data: { departments: v },
              include: idx + 1 === departmentDcArr.length ? valueInclude : undefined,
            }),
          ),
        ),
      );

      const updatedWithDivision = getLastOfArray(
        await prisma.$transaction(
          divisionsDcArr.map((v, idx) =>
            prisma.emergencyVehicleValue.update({
              where: { id: updatedValue.id },
              data: { divisions: v },
              include: idx + 1 === divisionsDcArr.length ? valueInclude : undefined,
            }),
          ),
        ),
      );

      return updatedWithDivision || updatedWithDepartment || updatedValue;
    });
  },
  GENDER: async (options: HandlerOptions) => typeHandlers.GENERIC({ ...options, type: "GENDER" }),
  ETHNICITY: async (options: HandlerOptions) =>
    typeHandlers.GENERIC({ ...options, type: "ETHNICITY" }),
  BLOOD_GROUP: async (options: HandlerOptions) =>
    typeHandlers.GENERIC({ ...options, type: "BLOOD_GROUP" }),
  IMPOUND_LOT: async (options: HandlerOptions) =>
    typeHandlers.GENERIC({ ...options, type: "IMPOUND_LOT" }),
  LICENSE: async (options: HandlerOptions) => typeHandlers.GENERIC({ ...options, type: "LICENSE" }),
  VEHICLE_FLAG: async (options: HandlerOptions) =>
    typeHandlers.GENERIC({ ...options, type: "VEHICLE_FLAG" }),
  ADDRESS_FLAG: async (options: HandlerOptions) =>
    typeHandlers.GENERIC({ ...options, type: "ADDRESS_FLAG" }),
  CITIZEN_FLAG: async (options: HandlerOptions) =>
    typeHandlers.GENERIC({ ...options, type: "CITIZEN_FLAG" }),
  VEHICLE_TRIM_LEVEL: async (options: HandlerOptions) =>
    typeHandlers.GENERIC({ ...options, type: "VEHICLE_TRIM_LEVEL" }),

  GENERIC: async ({ body, type, id }: HandlerOptions & { type: ValueType }): Promise<Value[]> => {
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
            isDisabled: item.isDisabled ?? false,
          },
          create: {
            isDefault: type === ValueType.LICENSE ? item.isDefault ?? false : false,
            type: type as ValueType,
            value: item.value,
            isDisabled: item.isDisabled ?? false,
            licenseType:
              type === ValueType.LICENSE ? (item.licenseType as ValueLicenseType) : undefined,
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

function makePrismaData<T extends { value: string; isDisabled: boolean | null | undefined }>(
  type: ValueType,
  data: T,
) {
  const { value, isDisabled, ...rest } = data;

  return {
    update: {
      ...rest,
      value: createValueObj({ value, type, isDisabled, updateType: "update" }),
    },
    create: {
      ...rest,
      value: createValueObj({ value, type, isDisabled, updateType: "create" }),
    },
  };
}

function createValueObj({
  value,
  type,
  updateType = "create",
  isDisabled,
}: {
  value: string;
  type: ValueType;
  updateType: "update" | "create";
  isDisabled: boolean | null | undefined;
}) {
  return {
    [updateType]: {
      isDefault: false,
      type,
      isDisabled: isDisabled ?? false,
      value: updateType === "update" ? { set: value } : value,
    },
  };
}

async function handlePromiseAll<T, R>(data: T[], handler: (item: T) => Promise<R>): Promise<R[]> {
  const success: R[] = [];

  await Promise.all(
    data.map(async (item) => {
      try {
        const data = await handler(item);
        success.push(data);
      } catch (e) {
        console.error(e);
      }
    }),
  );

  return success;
}
