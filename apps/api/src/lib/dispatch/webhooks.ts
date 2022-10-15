import type {
  Officer,
  EmsFdDeputy,
  Citizen,
  CombinedLeoUnit,
  MiscCadSettings,
  StatusValue,
  Value,
  cad,
  CadFeature,
} from "@prisma/client";
import { Feature } from "@snailycad/types";
import { generateCallsign } from "@snailycad/utils";
import { isFeatureEnabled } from "lib/cad";

export interface HandlePanicButtonPressedOptions {
  status: StatusValue;
  unit: (
    | ((Officer | EmsFdDeputy) & { citizen: Pick<Citizen, "name" | "surname"> })
    | CombinedLeoUnit
  ) & {
    status?: StatusValue | null;
  };
  cad: cad & { miscCadSettings: MiscCadSettings };
}

type V<T> = T & { value: Value };

export type Unit = { status: V<StatusValue> | null } & (
  | ((Officer | EmsFdDeputy) & {
      citizen: Pick<Citizen, "name" | "surname">;
    })
  | CombinedLeoUnit
);

export function createWebhookData(
  cad: { features?: CadFeature[]; miscCadSettings: MiscCadSettings },
  unit: Unit,
) {
  const isBadgeNumberEnabled = isFeatureEnabled({
    defaultReturn: true,
    feature: Feature.BADGE_NUMBERS,
    features: cad.features,
  });

  const isNotCombined = "citizenId" in unit;

  const status = unit.status?.value.value ?? "Off-duty";
  const unitName = isNotCombined ? `${unit.citizen.name} ${unit.citizen.surname}` : "";
  const callsign = generateCallsign(unit as any, cad.miscCadSettings.callsignTemplate);
  const badgeNumber = isBadgeNumberEnabled && isNotCombined ? `${unit.badgeNumber} - ` : "";
  const officerName = isNotCombined ? `${badgeNumber}${callsign} ${unitName}` : `${callsign}`;

  return {
    embeds: [
      {
        title: "Status Change",
        description: `Unit **${officerName}** has changed their status to ${status}`,
        fields: [
          {
            name: "Status",
            value: status,
            inline: true,
          },
        ],
      },
    ],
  };
}

export function createPanicButtonEmbed(
  cad: { features?: CadFeature[]; miscCadSettings: MiscCadSettings },
  unit: HandlePanicButtonPressedOptions["unit"],
) {
  const isCombined = !("citizen" in unit);

  const isBadgeNumberEnabled = isFeatureEnabled({
    defaultReturn: true,
    feature: Feature.BADGE_NUMBERS,
    features: cad.features,
  });

  const unitName = isCombined ? null : `${unit.citizen.name} ${unit.citizen.surname}`;
  const template = isCombined
    ? cad.miscCadSettings.pairedUnitSymbol
    : cad.miscCadSettings.callsignTemplate;

  const callsign = generateCallsign(unit as any, template);
  const badgeNumber = isBadgeNumberEnabled || isCombined ? "" : `${unit.badgeNumber} - `;
  const officerName = isCombined ? `${callsign}` : `${badgeNumber}${callsign} ${unitName}`;

  return {
    embeds: [
      {
        title: "Panic Button",
        description: `Unit **${officerName}** has pressed the panic button`,
      },
    ],
  };
}
