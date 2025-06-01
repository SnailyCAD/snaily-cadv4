import type { Call911, LeoIncident, Warrant } from "@prisma/client";
import { type DispatchChat } from "@snailycad/types";

type _Call911 = Call911 & { assignedUnits?: any[] };
type _Incident = LeoIncident & { unitsInvolved?: any[] };
type _Warrant = Warrant & { assignedOfficers?: any[] };
type _DispatchChat = DispatchChat & { creator?: any };

export function officerOrDeputyToUnit<T extends _Call911 | _Incident | _Warrant | _DispatchChat>(
  item: T | null,
): any {
  if (!item) return item;
  const array = getArray(item);

  return {
    ...item,
    [array.name]: (array.data ?? [])
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

function getArray<T extends _Call911 | _Incident | _Warrant | _DispatchChat>(item: T) {
  if ("assignedUnits" in item) return { data: item.assignedUnits, name: "assignedUnits" };
  if ("unitsInvolved" in item) return { data: item.unitsInvolved, name: "unitsInvolved" };
  if ("assignedOfficers" in item) return { data: item.assignedOfficers, name: "assignedOfficers" };
  return { data: [], name: "assignedUnits" };
}
