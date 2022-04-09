import type { Call911, LeoIncident } from "@prisma/client";

type _Call911 = Call911 & { assignedUnits?: any[] };
type _Incident = LeoIncident & { unitsInvolved?: any[] };

export function officerOrDeputyToUnit<T extends _Call911 | _Incident>(item: T | null): any {
  if (!item) return item;

  const isCall = "assignedUnits" in item;
  const isIncident = "unitsInvolved" in item;

  const arr = isCall ? item.assignedUnits : isIncident ? item.unitsInvolved : [];
  const name = isCall ? "assignedUnits" : "unitsInvolved";

  return {
    ...item,
    [name]: (arr ?? [])
      .map((v: any) => ({
        ...v,
        officer: undefined,
        deputy: undefined,
        combinedUnit: undefined,

        unit: v.officer ?? v.deputy ?? v.combinedUnit,
      }))
      .filter((v: any) => v.unit?.id),
  };
}
