import {
  ShouldDoType,
  StatusValue,
  Officer,
  EmsFdDeputy,
  Citizen,
  CombinedLeoUnit,
  MiscCadSettings,
  cad,
  DiscordWebhookType,
} from "@prisma/client";
import { sendDiscordWebhook, sendRawWebhook } from "lib/discord/webhooks";
import { createPanicButtonEmbed } from "lib/dispatch/webhooks";
import type { Socket } from "services/socket-service";

export interface HandlePanicButtonPressedOptions {
  locale?: string | null;
  force?: boolean;
  socket: Socket;
  status?: StatusValue | null;
  unit: (
    | ((Officer | EmsFdDeputy) & { citizen: Pick<Citizen, "name" | "surname"> })
    | CombinedLeoUnit
  ) & {
    status?: StatusValue | null;
  };
  cad: cad & { miscCadSettings: MiscCadSettings };
}

export function isUnitCurrentlyInPanicMode(unit: HandlePanicButtonPressedOptions["unit"]) {
  return unit.status?.shouldDo === ShouldDoType.PANIC_BUTTON;
}

export function isStatusPanicButton(status?: StatusValue | null) {
  return status?.shouldDo === ShouldDoType.PANIC_BUTTON;
}

export async function handlePanicButtonPressed(options: HandlePanicButtonPressedOptions) {
  const isCurrentlyPanicMode = isUnitCurrentlyInPanicMode(options.unit);
  const isPanicButton = isStatusPanicButton(options.status);

  const shouldEnablePanicMode =
    typeof options.force === "undefined" ? !isCurrentlyPanicMode && isPanicButton : options.force;

  if (shouldEnablePanicMode) {
    options.socket.emitPanicButtonLeo(options.unit, "ON");

    try {
      const embed = await createPanicButtonEmbed(options);
      await sendDiscordWebhook({ type: DiscordWebhookType.PANIC_BUTTON, data: embed });
      await sendRawWebhook({ type: DiscordWebhookType.PANIC_BUTTON, data: options.unit });
    } catch (error) {
      console.error("[cad_panicButton]: Could not send Discord webhook.", error);
    }
  } else {
    options.socket.emitPanicButtonLeo(options.unit, "OFF");
  }
}
