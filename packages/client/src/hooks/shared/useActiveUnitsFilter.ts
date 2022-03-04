import type { CombinedLeoUnit, EmsFdDeputy, Officer } from "@snailycad/types";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { makeUnitName } from "lib/utils";
import { useTranslations } from "next-intl";

export function useActiveUnitsFilter() {
  const { generateCallsign } = useGenerateCallsign();
  const common = useTranslations("Common");

  function handleFilter(unit: Officer | CombinedLeoUnit | EmsFdDeputy, search: string) {
    const isCombined = !("citizenId" in unit) || "officers" in unit;
    if (isCombined) {
      return;
    }

    const nameAndCallsign = `${generateCallsign(unit)} ${makeUnitName(unit)}`;

    const department = unit.department?.value.value ?? common("none");
    const rank = unit.rank?.value ?? common("none");
    const status = unit.status?.value.value ?? common("none");
    const radioChannel = unit.radioChannelId ?? common("none");
    const badgeNumber = unit.badgeNumber;
    const divisions =
      "divisions" in unit ? unit.divisions : "division" in unit ? [unit.division] : [];
    const divisionString = divisions.map((v) => v.value.value).join(",");

    const searchableArr = [
      nameAndCallsign,
      department,
      rank,
      status,
      radioChannel,
      badgeNumber,
      divisionString,
    ];

    const searchableString = searchableArr.join(" ").toLowerCase();
    return searchableString.includes(search.toLowerCase());
  }

  return { handleFilter };
}
