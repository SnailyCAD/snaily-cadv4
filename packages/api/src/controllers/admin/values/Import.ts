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
  validate,
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
    await handler?.(body);
  }

  private getTypeFromPath(path: string): ValueType {
    return path.replace("-", "_").toUpperCase() as ValueType;
  }
}

// todo: use this in `ValuesController`
const typeHandlers: Partial<
  Record<ValueType | "GENERIC", (body: any, valueType?: ValueType) => Promise<void>>
> = {
  VEHICLE: async (body) => {
    console.log({ body });

    const error = validate(HASH_SCHEMA_ARR, body, true);
    if (error) {
      throw new BadRequest(error);
    }

    const arr = body as { hash?: string; value: string }[];

    await Promise.all(
      arr.map(async (item) => {
        await prisma.vehicleValue.create({
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
    const error = validate(HASH_SCHEMA_ARR, body, true);
    if (error) {
      throw new BadRequest(error);
    }

    const arr = body as { hash?: string; value: string }[];

    await Promise.all(
      arr.map(async (item) => {
        await prisma.weaponValue.create({
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
    const error = validate(BUSINESS_ROLE_ARR, body, true);
    if (error) {
      throw new BadRequest(error);
    }

    const arr = body as { as: EmployeeAsEnum; value: string }[];

    await Promise.all(
      arr.map(async (item) => {
        await prisma.employeeValue.create({
          data: {
            as: item.as,
            value: {
              create: {
                isDefault: false,
                type: "BUSINESS_ROLE",
                value: item.value,
              },
            },
          },
        });
      }),
    );
  },
  DRIVERSLICENSE_CATEGORY: async (body) => {
    const error = validate(DLC_ARR, body, true);
    if (error) {
      throw new BadRequest(error);
    }

    const arr = body as { type: DriversLicenseCategoryType; value: string }[];

    await Promise.all(
      arr.map(async (item) => {
        await prisma.driversLicenseCategoryValue.create({
          data: {
            type: item.type,
            value: {
              create: {
                isDefault: false,
                type: "DRIVERSLICENSE_CATEGORY",
                value: item.value,
              },
            },
          },
        });
      }),
    );
  },
  DEPARTMENT: async (body) => {
    const error = validate(DEPARTMENT_ARR, body, true);
    if (error) {
      throw new BadRequest(error);
    }

    const arr = body as { type: DepartmentType; callsign: string; value: string }[];

    await Promise.all(
      arr.map(async (item) => {
        await prisma.departmentValue.create({
          data: {
            type: item.type,
            callsign: item.callsign,
            value: {
              create: {
                isDefault: false,
                type: "DEPARTMENT",
                value: item.value,
              },
            },
          },
        });
      }),
    );
  },
  CODES_10: async (body) => {
    const error = validate(CODES_10_ARR, body, true);
    if (error) {
      throw new BadRequest(error);
    }

    const arr = body as {
      color?: string;
      type: StatusValueType;
      shouldDo: ShouldDoType;
      value: string;
    }[];

    await Promise.all(
      arr.map(async (item) => {
        await prisma.statusValue.create({
          data: {
            type: item.type,
            color: item.color,
            shouldDo: item.shouldDo,
            value: {
              create: {
                isDefault: false,
                type: "CODES_10",
                value: item.value,
              },
            },
          },
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
    const error = validate(BASE_ARR, body, true);
    if (error) {
      throw new BadRequest(error);
    }

    const arr = body as { value: string }[];

    await Promise.all(
      arr.map(async (item) => {
        await prisma.value.create({
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
