import type { CombinedLeoUnit, EmsFdDeputy, Officer } from "@snailycad/types";

type P = "callsign" | "callsign2" | "department" | "citizenId" | "incremental";
type Unit =
  | Pick<Officer, P | "divisions" | "callsigns">
  | Pick<EmsFdDeputy, P | "division">
  | CombinedLeoUnit;

/**
 * given a unit and a template, generate a callsign for the unit
 * @param {Unit} unit - The unit object
 * @param {string | null} template - The template to use for the callsign.
 * @returns the generated callsign
 */
export function generateCallsign(unit: Unit, template: string | null) {
  const isCombined = !("citizenId" in unit) || "officers" in unit;
  const _template = isCombined && unit.pairedUnitTemplate ? unit.pairedUnitTemplate : template;

  const unitDivision =
    "divisions" in unit ? unit.divisions : "division" in unit ? unit.division : [];
  let [division] = Array.isArray(unitDivision) ? unitDivision : [unitDivision];

  const callsigns = "callsigns" in unit ? unit.callsigns : [];
  const callsign = callsigns?.find((v) => v.divisionId === division?.id);

  if (callsign && "divisions" in unit) {
    const unitDivision = unit.divisions.find((v) => v.id === callsign.divisionId);
    division = unitDivision;
  }

  if (!_template) {
    return "";
  }

  const replacers = {
    department: unit.department?.callsign,
    callsign1: unit.callsign,
    callsign2: unit.callsign2,
    division: division?.callsign,
    incremental: unit.incremental,
  };

  const templateArr: (string | null)[] = _template.split(/[{}]/);
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
