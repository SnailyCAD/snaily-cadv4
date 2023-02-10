import {
  Officer,
  EmsFdDeputy,
  Citizen,
  CombinedLeoUnit,
  MiscCadSettings,
  StatusValue,
  Value,
  Feature,
} from "@prisma/client";
import { generateCallsign } from "@snailycad/utils";
import { isFeatureEnabled } from "lib/cad";
import type { HandlePanicButtonPressedOptions } from "lib/leo/send-panic-button-webhook";
import { getTranslator } from "utils/get-translator";

type V<T> = T & { value: Value };

export type Unit = { status: V<StatusValue> | null } & (
  | ((Officer | EmsFdDeputy) & {
      citizen: Pick<Citizen, "name" | "surname">;
    })
  | CombinedLeoUnit
);

interface CreateWebhookDataOptions<Unit> {
  cad: { features?: Record<Feature, boolean>; miscCadSettings: MiscCadSettings };
  unit: Unit;
  locale?: string | null;
}

export async function createWebhookData(options: CreateWebhookDataOptions<Unit>) {
  const unit = options.unit;

  const isBadgeNumberEnabled = isFeatureEnabled({
    defaultReturn: true,
    feature: Feature.BADGE_NUMBERS,
    features: options.cad.features,
  });
  const translator = await getTranslator({
    type: "webhooks",
    locale: options.locale,
    namespace: "Statuses",
  });

  const isNotCombined = "citizenId" in unit;

  const status = options.unit.status?.value.value ?? "Off-duty";
  const unitName = isNotCombined ? `${unit.citizen.name} ${unit.citizen.surname}` : "";
  const callsign = generateCallsign(unit as any, options.cad.miscCadSettings.callsignTemplate);
  const badgeNumber = isBadgeNumberEnabled && isNotCombined ? `${unit.badgeNumber} - ` : "";
  const officerName = isNotCombined ? `${badgeNumber}${callsign} ${unitName}` : `${callsign}`;

  return {
    embeds: [
      {
        title: translator("statusChange"),
        description: translator("statusChangeDescription", {
          unit: officerName,
          status,
        }),
        fields: [
          {
            name: translator("status"),
            value: status,
            inline: true,
          },
        ],
      },
    ],
  };
}

export async function createPanicButtonEmbed(
  options: CreateWebhookDataOptions<HandlePanicButtonPressedOptions["unit"]>,
) {
  const unit = options.unit;
  const translator = await getTranslator({
    type: "webhooks",
    locale: options.locale,
    namespace: "PanicButton",
  });

  const isCombined = !("citizen" in unit);

  const isBadgeNumberEnabled = isFeatureEnabled({
    defaultReturn: true,
    feature: Feature.BADGE_NUMBERS,
    features: options.cad.features,
  });

  const unitName = isCombined ? null : `${unit.citizen.name} ${unit.citizen.surname}`;
  const template = isCombined
    ? options.cad.miscCadSettings.pairedUnitSymbol
    : options.cad.miscCadSettings.callsignTemplate;

  const callsign = generateCallsign(unit as any, template);
  const badgeNumber = isBadgeNumberEnabled || isCombined ? "" : `${unit.badgeNumber} - `;
  const officerName = isCombined ? `${callsign}` : `${badgeNumber}${callsign} ${unitName}`;

  return {
    embeds: [
      {
        title: translator("panicButton"),
        description: translator("panicButtonDescription", {
          unit: officerName,
        }),
      },
    ],
  };
}
