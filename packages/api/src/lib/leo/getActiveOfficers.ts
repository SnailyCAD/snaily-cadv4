import type { Prisma } from "@prisma/client";
import { cad, ShouldDoType } from "@snailycad/types";
import { prisma } from "lib/prisma";
import { combinedUnitProperties, leoProperties } from "./activeOfficer";
import { filterInactiveUnits, setInactiveUnitsOffDuty } from "./setInactiveUnitsOffDuty";
import { createInactivityFilter } from "./utils";

interface GetActiveOfficerOptions {
  cad: cad;
  skip?: number;
  includeAll?: boolean;
  query?: string;
}

export async function getActiveOfficers(options: GetActiveOfficerOptions) {
  const unitsInactivityFilter = createInactivityFilter(options.cad, "lastStatusChangeTimestamp");

  if (unitsInactivityFilter) {
    setInactiveUnitsOffDuty(unitsInactivityFilter.lastStatusChangeTimestamp);
  }

  const [officerCount, combinedUnitCount, combinedUnits, officers] = await Promise.all([
    prisma.officer.count({
      where: {
        status: { NOT: { shouldDo: ShouldDoType.SET_OFF_DUTY } },
        ...createOfficerWhereClause(options.query),
      },
    }),
    prisma.combinedLeoUnit.count({ where: createCombinedUnitWhereClause(options.query) }),
    prisma.combinedLeoUnit.findMany({
      include: combinedUnitProperties,
      where: createCombinedUnitWhereClause(options.query),
    }),
    prisma.officer.findMany({
      where: {
        status: { NOT: { shouldDo: ShouldDoType.SET_OFF_DUTY } },
        ...createOfficerWhereClause(options.query),
      },
      include: leoProperties,
      skip: options.includeAll ? undefined : options.skip,
      take: options.includeAll ? undefined : 15,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const officersWithUpdatedStatus = officers.map((u) =>
    filterInactiveUnits({ unit: u, unitsInactivityFilter }),
  );
  const combinedUnitsWithUpdatedStatus = combinedUnits.map((u) =>
    filterInactiveUnits({ unit: u, unitsInactivityFilter }),
  );

  return {
    officers: [...officersWithUpdatedStatus, ...combinedUnitsWithUpdatedStatus],
    totalCount: officerCount + combinedUnitCount,
  };
}

function createCombinedUnitWhereClause(query?: string) {
  if (!query) {
    return {};
  }

  const filters: Prisma.Enumerable<Prisma.CombinedLeoUnitWhereInput> = [
    {
      radioChannelId: { contains: query, mode: "insensitive" },
      officers: { some: createOfficerWhereClause(query) },
    },
  ];

  if (!isNaN(Number(query))) {
    filters.push(
      { activeCall: { caseNumber: parseInt(query, 10) } },
      { activeIncident: { caseNumber: parseInt(query, 10) } },
    );
  }

  return { OR: filters };
}

function createOfficerWhereClause(query?: string) {
  if (!query) {
    return {};
  }

  const filters: Prisma.Enumerable<Prisma.OfficerWhereInput> = [
    {
      citizen: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { surname: { contains: query, mode: "insensitive" } },
        ],
      },
    },
    { callsign: { contains: query, mode: "insensitive" } },
    { callsign2: { contains: query, mode: "insensitive" } },
    { department: { value: { value: { contains: query, mode: "insensitive" } } } },
    { rank: { value: { contains: query, mode: "insensitive" } } },
    { division: { value: { value: { contains: query, mode: "insensitive" } } } },
    { status: { value: { value: { contains: query, mode: "insensitive" } } } },
    { radioChannelId: { contains: query, mode: "insensitive" } },
  ];

  if (!isNaN(Number(query))) {
    filters.push(
      {
        badgeNumber: { equals: parseInt(query, 10) },
      },
      { activeCall: { caseNumber: parseInt(query, 10) } },
      { activeIncident: { caseNumber: parseInt(query, 10) } },
    );
  }

  return { OR: filters };
}
