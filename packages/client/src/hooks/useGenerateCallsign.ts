import { useAuth } from "context/AuthContext";
import type { FullDeputy, FullOfficer } from "state/dispatchState";
import type { CombinedLeoUnit } from "@snailycad/types";

type P = "callsign" | "callsign2" | "department" | "division";
type FullUnit = Pick<FullOfficer, P | "divisions"> | Pick<FullDeputy, P> | CombinedLeoUnit;

export function useGenerateCallsign() {
  const { cad } = useAuth();
  const miscCadSettings = cad?.miscCadSettings;

  function generateCallsign(unit: FullUnit) {
    if (!unit) return "NULL";
    if (!("department" in unit)) {
      return "NULL";
    }

    const { callsign, callsign2, department } = unit;
    const unitDivision = unit.division ?? ("divisions" in unit ? unit.divisions : []);

    const template = miscCadSettings?.callsignTemplate;
    const [division] = Array.isArray(unitDivision) ? unitDivision : [unitDivision];

    if (!template) {
      return "";
    }

    const replacers = {
      department: department?.callsign,
      callsign1: callsign,
      callsign2,
      division: division?.callsign,
    };

    const templateArr: (string | null)[] = template.split(/[{}]/);
    Object.entries(replacers).forEach(([replacer, value]) => {
      const idx = templateArr.indexOf(replacer);

      if (value) {
        templateArr[idx] = value;
      } else {
        templateArr[idx] = null;
      }
    });

    return templateArr.filter((v) => v !== null).join("");
  }

  return generateCallsign;
}
