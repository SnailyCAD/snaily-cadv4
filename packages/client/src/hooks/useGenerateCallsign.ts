import { useAuth } from "context/AuthContext";
import { FullDeputy, FullOfficer } from "state/dispatchState";

type P = "callsign" | "callsign2" | "department" | "division";
type FullUnit = Pick<FullOfficer, P> | Pick<FullDeputy, P>;

export function useGenerateCallsign() {
  const { cad } = useAuth();
  const miscCadSettings = cad?.miscCadSettings;

  function generateCallsign(unit: FullUnit) {
    const { callsign, callsign2, department, division } = unit;
    const template = miscCadSettings?.callsignTemplate ?? "";

    const replacers = {
      // todo department
      department: department.callsign,
      callsign1: callsign,
      callsign2,
      division: division.callsign,
    };

    const templateArr = template.split(/[{}]/);
    Object.entries(replacers).forEach(([replacer, value]) => {
      const idx = templateArr.indexOf(replacer);

      if (value) {
        templateArr[idx] = value;
      }
    });

    return templateArr.join("");
  }

  return generateCallsign;
}
