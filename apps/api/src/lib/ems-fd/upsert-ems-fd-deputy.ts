import type { ZodSchema } from "zod";
import {
  cad,
  Citizen,
  EmsFdDeputy,
  Feature,
  LeoWhitelistStatus,
  MiscCadSettings,
  ShouldDoType,
  User,
} from "@prisma/client";
import { validateSchema } from "lib/data/validate-schema";
import { EMS_FD_DEPUTY_SCHEMA } from "@snailycad/schemas";
import { isFeatureEnabled } from "lib/cad";
import { ExtendedBadRequest } from "src/exceptions/extended-bad-request";
import { prisma } from "lib/data/prisma";
import { validateMaxDepartmentsEachPerUser } from "lib/leo/utils";
import { validateDuplicateCallsigns } from "lib/leo/validateDuplicateCallsigns";
import { handleWhitelistStatus } from "lib/leo/handleWhitelistStatus";
import { findNextAvailableIncremental } from "lib/leo/findNextAvailableIncremental";
import { unitProperties } from "lib/leo/activeOfficer";
import { shouldCheckCitizenUserId } from "lib/citizen/hasCitizenAccess";
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

  if (isBadgeNumbersEnabled && !data.badgeNumber) {
    throw new ExtendedBadRequest({ badgeNumber: "Required" });
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

  await validateDuplicateCallsigns({
    callsign1: data.callsign,
    callsign2: data.callsign2,
    type: "ems-fd",
    unitId: options.existingDeputy?.id,
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
      where: { shouldDo: ShouldDoType.SET_ON_DUTY },
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
    badgeNumber: data.badgeNumber,
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
  // means the ems-fd deputy that is being created is a temporary unit
  let citizen: { id: string; userId: string | null } | null = options.existingDeputy?.citizenId
    ? { id: options.existingDeputy.citizenId, userId: options.existingDeputy.userId }
    : null;

  if (!citizen) {
    if (!options.user) {
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
      citizen =
        options.citizen ??
        (await prisma.citizen.findFirst({
          where: {
            id: options.data.citizenId,
            userId: checkCitizenUserId ? options.user.id : undefined,
          },
          select: { userId: true, id: true },
        }));
    }
  }

  if (!citizen) {
    throw new NotFound("citizenNotFound");
  }

  return citizen;
}
