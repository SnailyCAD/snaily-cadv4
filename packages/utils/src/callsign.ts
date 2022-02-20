import type { CombinedLeoUnit, EmsFdDeputy, Officer } from "@snailycad/types";

// todo: Pick<T, P>
type P = "callsign" | "callsign2" | "department" | "citizenId";
type Unit = Pick<Officer, P | "divisions"> | Pick<EmsFdDeputy, P | "division"> | CombinedLeoUnit;

export function generateCallsign(unit: Unit, template: string | null) {
  const isCombined = !("citizenId" in unit);

  const callsign = isCombined ? unit.officers[0]?.callsign : unit.callsign;
  const callsign2 = isCombined ? null : unit.callsign2;
  const department = isCombined ? null : unit.department;

  const unitDivision =
    "division" in unit ? unit.division : "divisions" in unit ? unit.divisions : [];

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
