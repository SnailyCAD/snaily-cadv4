import {
  MiscCadSettings,
  JailTimeScale,
  CombinedLeoUnit,
  Officer,
  AssignedUnit,
  IncidentInvolvedUnit,
  Feature,
  cad,
} from "@prisma/client";
import type { INDIVIDUAL_CALLSIGN_SCHEMA } from "@snailycad/schemas";
import { prisma } from "lib/data/prisma";
import { ExtendedBadRequest } from "src/exceptions/extended-bad-request";
import type { DisconnectOrConnect } from "lib/data/many-to-many";

interface MaxDepartmentOptions {
  type: "emsFdDeputy" | "officer";
  userId: string;
  cad: cad & { features?: Record<Feature, boolean>; miscCadSettings: MiscCadSettings };
  departmentId: string;
  unitId?: string;
}

export async function validateMaxDepartmentsEachPerUser({
  type,
  unitId,
  cad,
  userId,
  departmentId,
}: MaxDepartmentOptions) {
  if (!cad.miscCadSettings.maxDepartmentsEachPerUser) return;

  const extraWhere = unitId ? { NOT: { id: unitId } } : {};

  // @ts-expect-error methods are the same
  const departmentCount = await prisma[type].count({
    where: { userId, departmentId, ...extraWhere },
  });

  if (departmentCount >= cad.miscCadSettings.maxDepartmentsEachPerUser) {
    throw new ExtendedBadRequest({ department: "maxDepartmentsReachedPerUser" });
  }
}

type InactivityReturn<Prop extends string> = {
  filter: Record<
    Prop,
    {
      gte: Date;
    }
  >;
} & Record<Prop, Date>;

export function getInactivityFilter<Prop extends string = "updatedAt">(
  cad: { miscCadSettings: MiscCadSettings | null },
  type:
    | "incidentInactivityTimeout"
    | "call911InactivityTimeout"
    | "unitInactivityTimeout"
    | "activeWarrantsInactivityTimeout"
    | "boloInactivityTimeout"
    | "activeDispatchersInactivityTimeout",

  property?: Prop,
): InactivityReturn<Prop> | null {
  const inactivityTimeout = cad.miscCadSettings?.[type] ?? null;
  const _prop = property ?? "updatedAt";

  if (!inactivityTimeout) {
    return null;
  }

  const milliseconds = inactivityTimeout * (1000 * 60);
  const updatedAt = new Date(new Date().getTime() - milliseconds);

  const filter = {
    [_prop]: { gte: updatedAt },
  };

  return { filter, [_prop]: updatedAt } as InactivityReturn<Prop>;
}

export function convertToJailTimeScale(total: number, scale: JailTimeScale) {
  if (scale === JailTimeScale.HOURS) {
    return total * 60 * 60 * 1000 * 24;
  }

  if (scale === JailTimeScale.MINUTES) {
    return total * 60 * 1000;
  }

  return total * 1000;
}

export async function updateOfficerDivisionsCallsigns({
  officerId,
  disconnectConnectArr,
  callsigns,
}: {
  officerId: string;
  disconnectConnectArr: DisconnectOrConnect<string, never>[];
  callsigns?: Record<string, Zod.infer<typeof INDIVIDUAL_CALLSIGN_SCHEMA>> | null;
}) {
  if (!callsigns) return;

  const _callsigns = Object.values(callsigns);

  if (_callsigns.length <= 0) {
    await prisma.individualDivisionCallsign.deleteMany({
      where: { officerId },
    });
  }

  await Promise.all(
    _callsigns.map(async (callsign) => {
      const existing = await prisma.individualDivisionCallsign.findFirst({
        where: { officerId, divisionId: callsign.divisionId },
      });

      const doCallsignHaveValues =
        callsign.callsign.trim() !== "" && callsign.callsign2.trim() !== "";

      const shouldDelete =
        !doCallsignHaveValues ||
        disconnectConnectArr.find(
          (v) => "disconnect" in v && v.disconnect?.id === existing?.divisionId,
        );

      if (shouldDelete) {
        await prisma.individualDivisionCallsign.deleteMany({
          where: { id: String(existing?.id) },
        });
      } else {
        await prisma.individualDivisionCallsign.upsert({
          where: { id: String(existing?.id) },
          create: { ...callsign, officerId },
          update: { ...callsign, officerId },
        });
      }
    }),
  );
}

interface GetPrismaNameActiveCallIncidentOptions {
  unit: AssignedUnit | IncidentInvolvedUnit;
}

export function getPrismaNameActiveCallIncident(options: GetPrismaNameActiveCallIncidentOptions) {
  const prismaNames = {
    officerId: "officer",
    emsFdDeputyId: "emsFdDeputy",
    combinedLeoId: "combinedLeoUnit",
    combinedEmsFdId: "combinedEmsFdUnit",
  } as const;

  let prismaName: (typeof prismaNames)[keyof typeof prismaNames] | null = null;
  let unitId = null;
  for (const name in prismaNames) {
    const _unitId = options.unit[name as keyof typeof prismaNames];
    if (_unitId) {
      unitId = _unitId;
      prismaName = prismaNames[name as keyof typeof prismaNames];
    }

    continue;
  }

  return { prismaName, unitId };
}

interface GetFirstOfficerFromActiveOfficerOptions<AllowDispatch extends boolean = false> {
  activeOfficer: (CombinedLeoUnit & { officers: Officer[] }) | Officer | null;
  allowDispatch?: AllowDispatch;
}

type GetFirstOfficerFromActiveOfficerReturn<AllowDispatch extends boolean = false> =
  AllowDispatch extends true ? Officer | null : Officer;

export function getFirstOfficerFromActiveOfficer<AllowDispatch extends boolean = false>({
  activeOfficer,
  allowDispatch,
}: GetFirstOfficerFromActiveOfficerOptions<AllowDispatch>): GetFirstOfficerFromActiveOfficerReturn<AllowDispatch> {
  const isCombined = activeOfficer && "officers" in activeOfficer;
  const officer = isCombined ? activeOfficer.officers[0] : activeOfficer;

  if (allowDispatch && !officer) {
    return null as GetFirstOfficerFromActiveOfficerReturn<AllowDispatch>;
  }

  return officer as Officer;
}
