import { useAuth } from "context/AuthContext";
import type {
  CombinedEmsFdUnit,
  CombinedLeoUnit,
  EmsFdDeputy,
  MiscCadSettings,
  Officer,
} from "@snailycad/types";
import { generateCallsign } from "@snailycad/utils/callsign";

type P = "callsign" | "callsign2" | "department" | "citizenId" | "incremental";
type Unit =
  | Pick<Officer, P | "divisions" | "activeDivisionCallsign">
  | Pick<EmsFdDeputy, P | "division">
  | CombinedLeoUnit
  | CombinedEmsFdUnit;
type TemplateId = keyof Pick<MiscCadSettings, "pairedUnitTemplate" | "callsignTemplate">;

export function useGenerateCallsign() {
  const { cad } = useAuth();
  const miscCadSettings = cad?.miscCadSettings;

  function _generateCallsign(unit: Unit, templateId: TemplateId = "callsignTemplate") {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!unit) return "";

    const activeDivisionCallsign =
      "activeDivisionCallsign" in unit ? unit.activeDivisionCallsign : null;

    if (activeDivisionCallsign && "divisions" in unit) {
      const officer = { ...unit };
      const idx = unit.divisions.findIndex((v) => v.id === activeDivisionCallsign.divisionId);
      const division = unit.divisions.find((v) => v.id === activeDivisionCallsign.divisionId);

      const [temp] = officer.divisions;

      if (division && temp) {
        officer.divisions[0] = division;
        officer.divisions[idx] = temp;

        return generateCallsign(
          {
            ...unit,
            ...officer,
            callsign: activeDivisionCallsign.callsign,
            callsign2: activeDivisionCallsign.callsign2,
          },
          miscCadSettings?.[templateId] ?? null,
        );
      }
    }

    return generateCallsign(unit, miscCadSettings?.[templateId] ?? null);
  }

  return { generateCallsign: _generateCallsign };
}
