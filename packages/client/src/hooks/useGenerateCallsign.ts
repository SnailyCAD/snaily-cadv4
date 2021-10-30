import { useAuth } from "context/AuthContext";
import { FullDeputy, FullOfficer } from "state/dispatchState";

type P = "callsign" | "callsign2" | "department" | "division";
type FullUnit = Pick<FullOfficer, P> | Pick<FullDeputy, P>;

export function useGenerateCallsign() {
  const { cad } = useAuth();
  const miscCadSettings = cad?.miscCadSettings;

  function generateCallsign(unit: FullUnit) {
    if (!unit) return "NULL";
    const { callsign, callsign2, department, division } = unit;
    const template = miscCadSettings?.callsignTemplate ?? "";

    const replacers = {
      department: department.callsign,
      callsign1: callsign,
      callsign2,
      division: division.callsign,
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
