import type {
  CombinedEmsFdUnit,
  CombinedLeoUnit,
  DivisionValue,
  EmsFdDeputy,
  Officer,
} from "@snailycad/types";
import { isUnitCombined, isUnitCombinedEmsFd } from "@snailycad/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { makeUnitName } from "lib/utils";
import { useTranslations } from "next-intl";

export function useActiveUnitsFilter() {
  const { generateCallsign } = useGenerateCallsign();
  const common = useTranslations("Common");

  function handleFilter(
    unit: Officer | CombinedLeoUnit | CombinedEmsFdUnit | EmsFdDeputy,
    search: string,
  ) {
    const isCombined = isUnitCombined(unit) || isUnitCombinedEmsFd(unit);

    const nameAndCallsign = isCombined
      ? generateCallsign(unit, "pairedUnitTemplate")
      : `${generateCallsign(unit)} ${makeUnitName(unit)}`;

    const officers =
      isUnitCombined(unit) &&
      unit.officers.map((v) => `${generateCallsign(v)} ${makeUnitName(v)}`).join(", ");
    const deputies =
      isUnitCombinedEmsFd(unit) &&
      unit.deputies.map((v) => `${generateCallsign(v)} ${makeUnitName(v)}`).join(", ");

    const department = !isCombined && (unit.department?.value.value ?? common("none"));
    const rank = !isCombined && (unit.rank?.value ?? common("none"));
    const status = unit.status?.value.value ?? common("none");
    const radioChannel = unit.radioChannelId ?? common("none");
    const badgeNumber = !isCombined && unit.badgeNumber;

    const divisions = (
      "divisions" in unit ? unit.divisions : "division" in unit ? [unit.division] : []
    ).filter(Number) as DivisionValue[];

    const divisionString = divisions.map((v) => v.value.value).join(",");

    const searchableArr = [
      nameAndCallsign,
      department,
      rank,
      status,
      radioChannel,
      badgeNumber,
      divisionString,
      officers,
      deputies,
    ];

    const searchableString = searchableArr.filter(Boolean).join(" ").toLowerCase();
    return searchableString.includes(search.trim().toLowerCase());
  }

  return { handleFilter };
}
