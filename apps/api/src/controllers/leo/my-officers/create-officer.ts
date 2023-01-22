import { CREATE_OFFICER_SCHEMA } from "@snailycad/schemas";
import {
  cad,
  CadFeature,
  Citizen,
  Feature,
  MiscCadSettings,
  ShouldDoType,
  User,
} from "@prisma/client";
import { shouldCheckCitizenUserId } from "lib/citizen/hasCitizenAccess";
import { prisma } from "lib/data/prisma";
import { validateSchema } from "lib/data/validate-schema";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { isFeatureEnabled } from "lib/cad";
import { ExtendedBadRequest } from "src/exceptions/extended-bad-request";
import { updateOfficerDivisionsCallsigns, validateMaxDepartmentsEachPerUser } from "lib/leo/utils";
import { validateMaxDivisionsPerUnit } from "./MyOfficersController";
import { handleWhitelistStatus } from "lib/leo/handleWhitelistStatus";
import { validateDuplicateCallsigns } from "lib/leo/validateDuplicateCallsigns";
import { findNextAvailableIncremental } from "lib/leo/findNextAvailableIncremental";
import { validateImageURL } from "lib/images/validate-image-url";
import { getLastOfArray, manyToManyHelper } from "lib/data/many-to-many";
import { leoProperties } from "lib/leo/activeOfficer";
import type * as APITypes from "@snailycad/types/api";
import type { ZodSchema } from "zod";
import generateBlurPlaceholder from "lib/images/generate-image-blur-data";

interface CreateOfficerOptions {
  schema?: ZodSchema;
  body: unknown;
  citizen?: Citizen | null;
  user?: User;
  cad: cad & { features: CadFeature[]; miscCadSettings: MiscCadSettings };
  includeProperties?: boolean;
}

export async function createOfficer({
  body,
  schema = CREATE_OFFICER_SCHEMA,
  user,
  cad,
  citizen: _citizen,
  includeProperties = true,
}: CreateOfficerOptions) {
  const data = validateSchema(schema, body);

  // mean,s the officer that is being created is a temporary unit
  let citizen: { id: string; userId: string | null } | null;

  if (!user) {
    citizen = await prisma.citizen.create({
      data: {
        address: "",
        dateOfBirth: new Date(),
        eyeColor: "",
        hairColor: "",
        height: "",
        weight: "",
        name: data.name,
        surname: data.surname,
      },
      select: { userId: true, id: true },
    });
  } else {
    const checkCitizenUserId = shouldCheckCitizenUserId({ cad, user });
    citizen =
      _citizen ??
      (await prisma.citizen.findFirst({
        where: {
          id: data.citizenId,
          userId: checkCitizenUserId ? user.id : undefined,
        },
        select: { userId: true, id: true },
      }));
  }

  if (!citizen) {
    throw new NotFound("citizenNotFound");
  }

  const divisionsEnabled = isFeatureEnabled({
    feature: Feature.DIVISIONS,
    defaultReturn: true,
    features: cad.features,
  });

  if (divisionsEnabled) {
    if (!data.divisions || data.divisions.length <= 0) {
      throw new ExtendedBadRequest({ divisions: "Must have at least 1 item" });
    }

    await validateMaxDivisionsPerUnit(data.divisions, cad);

    if (user) {
      await validateMaxDepartmentsEachPerUser({
        departmentId: data.department,
        userId: user.id,
        cad,
        type: "officer",
      });
    }
  }

  if (user) {
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

  if (isBadgeNumbersEnabled && !data.badgeNumber) {
    throw new ExtendedBadRequest({ badgeNumber: "Required" });
  }

  const { defaultDepartment, department, whitelistStatusId } = await handleWhitelistStatus(
    data.department,
    null,
  );

  await validateDuplicateCallsigns({
    callsign1: data.callsign,
    callsign2: data.callsign2,
    type: "leo",
  });

  const incremental = await findNextAvailableIncremental({ type: "leo" });
  const validatedImageURL = validateImageURL(data.image);

  let statusId: string | undefined;

  if (!user) {
    const onDutyStatus = await prisma.statusValue.findFirst({
      where: { shouldDo: ShouldDoType.SET_ON_DUTY },
    });

    statusId = onDutyStatus?.id;
  }

  let officer: any = await prisma.officer.create({
    data: {
      callsign: data.callsign,
      callsign2: data.callsign2,
      userId: user?.id,
      departmentId: defaultDepartment ? defaultDepartment.id : data.department,
      rankId:
        (defaultDepartment
          ? defaultDepartment.defaultOfficerRankId
          : department.defaultOfficerRankId) || undefined,
      badgeNumber: isBadgeNumbersEnabled ? data.badgeNumber : undefined,
      citizenId: citizen.id,
      imageId: validatedImageURL,
      imageBlurData: await generateBlurPlaceholder(validatedImageURL),
      whitelistStatusId,
      incremental,
      statusId,
      identifiers: data.identifiers,
    },
    include: leoProperties,
  });

  if (divisionsEnabled) {
    const disconnectConnectArr = manyToManyHelper([], toIdString(data.divisions));

    await updateOfficerDivisionsCallsigns({
      officerId: officer.id,
      disconnectConnectArr,
      callsigns: data.callsigns,
    });

    officer = getLastOfArray(
      await prisma.$transaction(
        disconnectConnectArr.map((v, idx) =>
          prisma.officer.update({
            where: { id: officer.id },
            data: { divisions: v },
            include:
              idx + 1 === disconnectConnectArr.length
                ? includeProperties
                  ? {
                      ...leoProperties,
                      qualifications: { include: { qualification: { include: { value: true } } } },
                    }
                  : undefined
                : undefined,
          }),
        ),
      ),
    );
  }

  return officer as APITypes.PostMyOfficersData;
}

function toIdString(array: (string | { value: string })[]) {
  return array.map((v) => (typeof v === "string" ? v : v.value));
}
