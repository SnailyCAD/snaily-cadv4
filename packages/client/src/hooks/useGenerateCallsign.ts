import { useAuth } from "context/AuthContext";
import type { CombinedLeoUnit, EmsFdDeputy, MiscCadSettings, Officer } from "@snailycad/types";
import { generateCallsign } from "@snailycad/utils/callsign";

type P = "callsign" | "callsign2" | "department" | "citizenId" | "incremental";
type Unit = Pick<Officer, P | "divisions"> | Pick<EmsFdDeputy, P | "division"> | CombinedLeoUnit;
type TemplateId = keyof Pick<MiscCadSettings, "pairedUnitTemplate" | "callsignTemplate">;

export function useGenerateCallsign() {
  const { cad } = useAuth();
  const miscCadSettings = cad?.miscCadSettings;

  function _generateCallsign(unit: Unit, templateId: TemplateId = "callsignTemplate") {
    return generateCallsign(unit, miscCadSettings?.[templateId] ?? null);
  }

  return { generateCallsign: _generateCallsign };
}
