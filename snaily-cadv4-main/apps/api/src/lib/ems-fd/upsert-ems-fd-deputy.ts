import type { ZodSchema } from "zod";
import {
  type cad,
  type Citizen,
  type EmsFdDeputy,
  Feature,
  type LeoWhitelistStatus,
  type MiscCadSettings,
  ShouldDoType,
  type User,
  WhatPages,
} from "@prisma/client";
import { validateSchema } from "lib/data/validate-schema";
import { EMS_FD_DEPUTY_SCHEMA } from "@snailycad/schemas";
import { isFeatureEnabled } from "lib/upsert-cad";
import { ExtendedBadRequest } from "~/exceptions/extended-bad-request";
import { prisma } from "lib/data/prisma";
import { validateMaxDepartmentsEachPerUser } from "lib/leo/utils";
import { validateDuplicateCallsigns } from "lib/leo/validateDuplicateCallsigns";
import { handleWhitelistStatus } from "lib/leo/handleWhitelistStatus";
import { findNextAvailableIncremental } from "lib/leo/findNextAvailableIncremental";
import { unitProperties } from "utils/leo/includes";
import { shouldCheckCitizenUserId } from "lib/citizen/has-citizen-access";
import { NotFound } from "@tsed/exceptions";
import { validateImageURL } from "lib/images/validate-image-url";
import generateBlurPlaceholder from "lib/images/generate-image-blur-data";

interface UpsertEmsFdDeputyOptions {
  existingDeputy: (EmsFdDeputy & { whitelistStatus?: LeoWhitelistStatus | null }) | null;
  schema?: ZodSchema;
  body: unknown;
  citizen?: Citizen | null;
  user?: User;
  cad: cad & { features?: Record<Feature, boolean>; miscCadSettings: MiscCadSettings };
}

export async function upsertEmsFdDeputy(options: UpsertEmsFdDeputyOptions) {
  const schema = options.schema ?? EMS_FD_DEPUTY_SCHEMA;
  const data = validateSchema(schema, options.body);

  const divisionsEnabled = isFeatureEnabled({
    feature: Feature.DIVISIONS,
    defaultReturn: true,
    features: options.cad.features,
  });

  const isBadgeNumbersEnabled = isFeatureEnabled({
    feature: Feature.BADGE_NUMBERS,
    defaultReturn: true,
    features: options.cad.features,
  });

  if (isBadgeNumbersEnabled && !data.badgeNumberString) {
    throw new ExtendedBadRequest({ badgeNumberString: "Required" });
  }

  if (divisionsEnabled) {
    const division = await prisma.divisionValue.findFirst({
      where: {
        id: data.division,
        departmentId: data.department,
      },
    });

    if (!division) {
      throw new ExtendedBadRequest({ division: "divisionNotInDepartment" });
    }
  }

  if (options.user) {
    await validateMaxDepartmentsEachPerUser({
      departmentId: data.department,
      userId: options.user.id,
      cad: options.cad,
      type: "emsFdDeputy",
      unitId: options.existingDeputy?.id,
    });
  }

  const allowMultipleUnitsWithSameDeptPerUser = isFeatureEnabled({
    feature: Feature.ALLOW_MULTIPLE_UNITS_DEPARTMENTS_PER_USER,
    defaultReturn: false,
    features: options.cad.features,
  });

  await validateDuplicateCallsigns({
    departmentId: data.department,
    callsign1: data.callsign,
    callsign2: data.callsign2,
    type: "ems-fd",
    unitId: options.existingDeputy?.id,
    userId: allowMultipleUnitsWithSameDeptPerUser ? options.user?.id : undefined,
  });

  const citizen = await upsertEmsFdCitizen({ ...options, data });

  const { defaultDepartment, department, whitelistStatusId } = await handleWhitelistStatus(
    data.department,
    options.existingDeputy ?? null,
  );

  const incremental = options.existingDeputy
    ? undefined
    : await findNextAvailableIncremental({ type: "ems-fd" });
  const rank =
    (defaultDepartment
      ? defaultDepartment.defaultOfficerRankId
      : department.defaultOfficerRankId) || undefined;
  const validatedImageURL = validateImageURL(data.image);

  let statusId: string | undefined;
  if (!options.user) {
    const onDutyStatus = await prisma.statusValue.findFirst({
      where: {
        shouldDo: ShouldDoType.SET_ON_DUTY,
        OR: [{ whatPages: { isEmpty: true } }, { whatPages: { has: WhatPages.EMS_FD } }],
      },
    });

    statusId = onDutyStatus?.id;
  }

  const createUpdateData = {
    statusId,
    callsign: data.callsign,
    callsign2: data.callsign2,
    userId: options.user?.id,
    departmentId: defaultDepartment ? defaultDepartment.id : data.department,
    rankId: rank,
    divisionId: data.division || null,
    badgeNumberString: data.badgeNumberString,
    citizenId: citizen.id,
    incremental,
    whitelistStatusId,
    identifiers: data.identifiers,
    isTemporary: !options.user,
    imageId: validatedImageURL,
    imageBlurData: await generateBlurPlaceholder(validatedImageURL),
  };

  const emsFdDeputy = await prisma.emsFdDeputy.upsert({
    where: { id: options.existingDeputy?.id || "undefined" },
    create: createUpdateData,
    update: createUpdateData,
    include: {
      ...unitProperties,
      qualifications: { include: { qualification: { include: { value: true } } } },
    },
  });

  return emsFdDeputy;
}

/**
 * find or create the citizen for the ems-fd deputy with the given data
 */
async function upsertEmsFdCitizen(
  options: Omit<UpsertEmsFdDeputyOptions, "body" | "schema"> & { data: any },
) {
  if (options.citizen) {
    return options.citizen;
  }

  // means the ems-fd deputy that is being created is a temporary unit
  let citizen: { id: string; userId: string | null } | null = options.existingDeputy?.citizenId
    ? { id: options.existingDeputy.citizenId, userId: options.existingDeputy.userId }
    : null;

  if (!citizen) {
    if (!options.user) {
      // temporary unit's citizen
      citizen = await prisma.citizen.create({
        data: {
          address: "",
          dateOfBirth: new Date(),
          eyeColor: "",
          hairColor: "",
          height: "",
          weight: "",
          name: options.data.name,
          surname: options.data.surname,
        },
        select: { userId: true, id: true },
      });
    } else {
      const checkCitizenUserId = shouldCheckCitizenUserId({
        cad: options.cad,
        user: options.user,
      });
      citizen = await prisma.citizen.findFirst({
        where: {
          id: options.data.citizenId,
          userId: checkCitizenUserId ? options.user.id : undefined,
        },
        select: { userId: true, id: true },
      });
    }
  }

  if (!citizen) {
    throw new NotFound("citizenNotFound");
  }

  return citizen;
}
