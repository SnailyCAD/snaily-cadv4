import type { Call911, LeoIncident, Warrant } from "@prisma/client";

type _Call911 = Call911 & { assignedUnits?: any[] };
type _Incident = LeoIncident & { unitsInvolved?: any[] };
type _Warrant = Warrant & { assignedOfficers?: any[] };

export function officerOrDeputyToUnit<T extends _Call911 | _Incident | _Warrant>(
  item: T | null,
): any {
  if (!item) return item;

  const isCall = "assignedUnits" in item;
  const isIncident = "unitsInvolved" in item;
  const isWarrant = "assignedOfficers" in item;

  const arr = isCall
    ? item.assignedUnits
    : isIncident
    ? item.unitsInvolved
    : isWarrant
    ? item.assignedOfficers
    : [];

  const name = isCall ? "assignedUnits" : isIncident ? "unitsInvolved" : "assignedOfficers";

  return {
    ...item,
    [name]: (arr ?? [])
      .map((v: any) => ({
        ...v,
        officer: undefined,
        deputy: undefined,
        combinedUnit: undefined,
        combinedEmsFdUnit: undefined,

        unit: v.officer ?? v.deputy ?? v.combinedUnit ?? v.combinedEmsFdUnit,
      }))
      .filter((v: any) => v.unit?.id),
  };
}
