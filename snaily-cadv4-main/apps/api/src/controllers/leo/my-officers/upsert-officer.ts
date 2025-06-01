import { CREATE_OFFICER_SCHEMA } from "@snailycad/schemas";
import {
  type cad,
  type Citizen,
  type DivisionValue,
  Feature,
  type LeoWhitelistStatus,
  type MiscCadSettings,
  type Officer,
  ShouldDoType,
  type User,
  WhatPages,
} from "@prisma/client";
import { shouldCheckCitizenUserId } from "lib/citizen/has-citizen-access";
import { prisma } from "lib/data/prisma";
import { validateSchema } from "lib/data/validate-schema";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { isFeatureEnabled } from "lib/upsert-cad";
import { ExtendedBadRequest } from "~/exceptions/extended-bad-request";
import { updateOfficerDivisionsCallsigns, validateMaxDepartmentsEachPerUser } from "lib/leo/utils";
import { validateMaxDivisionsPerUnit } from "./MyOfficersController";
import { handleWhitelistStatus } from "lib/leo/handleWhitelistStatus";
import { validateDuplicateCallsigns } from "lib/leo/validateDuplicateCallsigns";
import { findNextAvailableIncremental } from "lib/leo/findNextAvailableIncremental";
import { validateImageURL } from "lib/images/validate-image-url";
import { getLastOfArray, manyToManyHelper } from "lib/data/many-to-many";
import { leoProperties } from "utils/leo/includes";

import type * as APITypes from "@snailycad/types/api";
import type { ZodSchema } from "zod";
import generateBlurPlaceholder from "lib/images/generate-image-blur-data";
import { WhitelistStatus } from "@snailycad/types";
import { sendUnitWhitelistStatusChangeWebhook } from "~/controllers/admin/manage/units/manage-units-controller";

interface CreateOfficerOptions {
  schema?: ZodSchema;
  body: unknown;
  citizen?: Citizen | null;
  user?: User;
  cad: cad & { features?: Record<Feature, boolean>; miscCadSettings: MiscCadSettings };
  includeProperties?: boolean;
  existingOfficer?:
    | (Officer & {
        divisions: DivisionValue[];
        whitelistStatus?: LeoWhitelistStatus | null;
      })
    | null;
}

export async function upsertOfficer({
  body,
  schema = CREATE_OFFICER_SCHEMA,
  user,
  cad,
  citizen: _citizen,
  includeProperties = true,
  existingOfficer,
}: CreateOfficerOptions) {
  const data = validateSchema(schema, body);

  const citizen = await upsertOfficerCitizen({
    user,
    cad,
    citizen: _citizen,
    includeProperties,
    existingOfficer,
    data,
  });

  const divisionsEnabled = isFeatureEnabled({
    feature: Feature.DIVISIONS,
    defaultReturn: true,
    features: cad.features,
  });

  const allowMultipleOfficersWithSameDeptPerUser = isFeatureEnabled({
    feature: Feature.ALLOW_MULTIPLE_UNITS_DEPARTMENTS_PER_USER,
    defaultReturn: false,
    features: cad.features,
  });

  if (divisionsEnabled) {
    if (!data.divisions || data.divisions.length <= 0) {
      throw new ExtendedBadRequest({ divisions: "Must have at least 1 item" });
    }

    validateMaxDivisionsPerUnit(data.divisions, cad);
  }

  if (user) {
    await validateMaxDepartmentsEachPerUser({
      departmentId: data.department,
      userId: user.id,
      cad,
      type: "officer",
      unitId: existingOfficer?.id,
    });
  }

  await validateDuplicateCallsigns({
    departmentId: data.department,
    callsign1: data.callsign,
    callsign2: data.callsign2,
    type: "leo",
    unitId: existingOfficer?.id,
    userId: allowMultipleOfficersWithSameDeptPerUser ? user?.id : undefined,
  });

  if (user && !existingOfficer) {
    const officerCount = await prisma.officer.count({
      where: { userId: user.id },
    });

    if (
      cad.miscCadSettings.maxOfficersPerUser &&
      officerCount >= cad.miscCadSettings.maxOfficersPerUser
    ) {
      throw new BadRequest("maxLimitOfficersPerUserReached");
    }
  }

  const isBadgeNumbersEnabled = isFeatureEnabled({
    feature: Feature.BADGE_NUMBERS,
    defaultReturn: true,
    features: cad.features,
  });

  if (isBadgeNumbersEnabled && !data.badgeNumberString) {
    throw new ExtendedBadRequest({ badgeNumberString: "Required" });
  }

  const { defaultDepartment, department, whitelistStatusId } = await handleWhitelistStatus(
    data.department,
    existingOfficer ?? null,
  );

  const incremental = existingOfficer
    ? undefined
    : await findNextAvailableIncremental({ type: "leo" });
  const validatedImageURL = validateImageURL(data.image);

  let statusId: string | undefined;
  if (!user) {
    const onDutyStatus = await prisma.statusValue.findFirst({
      where: {
        shouldDo: ShouldDoType.SET_ON_DUTY,
        OR: [{ whatPages: { isEmpty: true } }, { whatPages: { has: WhatPages.LEO } }],
      },
    });

    statusId = onDutyStatus?.id;
  }

  let newRankId;
  if (existingOfficer && existingOfficer.departmentId === data.department) {
    newRankId = existingOfficer.rankId;
  } else {
    newRankId =
      (defaultDepartment
        ? defaultDepartment.defaultOfficerRankId
        : department.defaultOfficerRankId) || undefined;
  }

  const createUpdateFields = {
    callsign: data.callsign,
    callsign2: data.callsign2,
    userId: user?.id,
    departmentId: defaultDepartment ? defaultDepartment.id : data.department,
    rankId: newRankId,
    badgeNumberString: isBadgeNumbersEnabled ? data.badgeNumberString : undefined,
    citizenId: citizen.id,
    imageId: validatedImageURL,
    imageBlurData: await generateBlurPlaceholder(validatedImageURL),
    whitelistStatusId,
    incremental,
    statusId,
    identifiers: data.identifiers,
    isTemporary: !user,
  };

  let officer: any = await prisma.officer.upsert({
    where: { id: existingOfficer?.id || "undefined" },
    create: createUpdateFields,
    update: createUpdateFields,
    include: leoProperties,
  });

  if (officer.whitelistStatus?.status === WhitelistStatus.PENDING) {
    await sendUnitWhitelistStatusChangeWebhook(officer);
  }

  if (divisionsEnabled) {
    const disconnectConnectArr = manyToManyHelper(
      existingOfficer?.divisions.map((v) => v.id) ?? [],
      toIdString(data.divisions),
      { showUpsert: false },
    );

    await updateOfficerDivisionsCallsigns({
      officerId: officer.id,
      disconnectConnectArr,
      callsigns: data.callsigns,
    });

    officer = getLastOfArray(
      await prisma.$transaction(
        disconnectConnectArr.map((v, idx) => {
          const isAtEnd = idx + 1 === disconnectConnectArr.length;

          return prisma.officer.update({
            where: { id: officer.id },
            data: { divisions: v },
            include: isAtEnd ? getIncludes(includeProperties) : undefined,
          });
        }),
      ),
    );
  }

  return officer as APITypes.PostMyOfficersData;
}

function getIncludes(includeProperties: boolean) {
  if (includeProperties) {
    return {
      ...leoProperties,
      qualifications: { include: { qualification: { include: { value: true } } } },
    };
  }

  return undefined;
}

function toIdString(array: (string | { value: string })[]) {
  return array.map((v) => (typeof v === "string" ? v : v.value));
}

/**
 * find or create the citizen for the officer with the given data
 */
async function upsertOfficerCitizen(
  options: Omit<CreateOfficerOptions, "body" | "schema"> & { data: any },
) {
  if (options.citizen) {
    return options.citizen;
  }

  // means the officer that is being created is a temporary unit
  let citizen: { id: string; userId: string | null } | null = options.existingOfficer?.citizenId
    ? { id: options.existingOfficer.citizenId, userId: options.existingOfficer.userId }
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
