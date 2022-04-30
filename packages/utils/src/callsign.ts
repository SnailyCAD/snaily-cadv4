import type { CombinedLeoUnit, EmsFdDeputy, Officer } from "@snailycad/types";

type P = "callsign" | "callsign2" | "department" | "citizenId";
type Unit = Pick<Officer, P | "divisions"> | Pick<EmsFdDeputy, P | "division"> | CombinedLeoUnit;

/**
 * given a unit and a template, generate a callsign for the unit
 * @param {Unit} unit - The unit object
 * @param {string | null} template - The template to use for the callsign.
 * @returns the generated callsign
 */
export function generateCallsign(unit: Unit, template: string | null) {
  const isCombined = !("citizenId" in unit) || "officers" in unit;
  const incremental = isCombined ? unit.incremental : null;

  const unitDivision =
    "divisions" in unit ? unit.divisions : "division" in unit ? unit.division : [];
  const [division] = Array.isArray(unitDivision) ? unitDivision : [unitDivision];

  if (!template) {
    return "";
  }

  const replacers = {
    department: unit.department?.callsign,
    callsign1: unit.callsign,
    callsign2: unit.callsign2,
    division: division?.callsign,
    incremental,
  };

  const templateArr: (string | null)[] = template.split(/[{}]/);
  Object.entries(replacers).forEach(([replacer, value]) => {
    const idx = templateArr.indexOf(replacer);

    if (value) {
      templateArr[idx] = value.toString();
    } else {
      templateArr[idx] = null;
    }
  });

  return templateArr.filter((v) => v !== null).join("");
}
