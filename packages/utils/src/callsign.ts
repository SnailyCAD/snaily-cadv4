import type { CombinedEmsFdUnit, CombinedLeoUnit, EmsFdDeputy, Officer } from "@snailycad/types";
import { replaceTemplateVariables } from "./utils/replace-template-variables";

type P = "callsign" | "callsign2" | "department" | "citizenId" | "incremental";
type Unit =
  | Pick<Officer, P | "divisions" | "callsigns">
  | Pick<EmsFdDeputy, P | "division">
  | CombinedLeoUnit
  | CombinedEmsFdUnit;

/**
 * given a unit and a template, generate a callsign for the unit
 * @param {Unit} unit - The unit object
 * @param {string | null} template - The template to use for the callsign.
 * @returns the generated callsign
 */
export function generateCallsign(unit: Unit, template: string | null) {
  const isCombined = !("citizenId" in unit) || "officers" in unit || "deputies" in unit;
  const _template = isCombined && unit.pairedUnitTemplate ? unit.pairedUnitTemplate : template;

  const unitDivision =
    "divisions" in unit ? unit.divisions : "division" in unit ? unit.division : [];
  const [division] = Array.isArray(unitDivision) ? unitDivision : [unitDivision];

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

  return replaceTemplateVariables(_template, replacers);
}
