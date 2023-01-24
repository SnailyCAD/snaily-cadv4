import { DiscordWebhookType } from "@prisma/client";
import { prisma } from "lib/data/prisma";

export async function webhookIdToWebhooks() {
  const cad = await prisma.cad.findFirst({
    include: {
      miscCadSettings: { include: { webhooks: true } },
    },
  });

  if (!cad?.miscCadSettings || !cad.miscCadSettingsId) return;

  const { call911WebhookId, statusesWebhookId, panicButtonWebhookId, boloWebhookId } =
    cad.miscCadSettings;

  const types = {
    call911WebhookId: { id: call911WebhookId, type: DiscordWebhookType.CALL_911 },
    statusesWebhookId: { id: statusesWebhookId, type: DiscordWebhookType.UNIT_STATUS },
    panicButtonWebhookId: { id: panicButtonWebhookId, type: DiscordWebhookType.PANIC_BUTTON },
    boloWebhookId: { id: boloWebhookId, type: DiscordWebhookType.BOLO },
  } as const;

  for (const type in types) {
    type Key = keyof typeof types;
    const data = types[type as Key];

    if (!data.id) {
      continue;
    }

    const createUpdateData = {
      channelId: data.id,
      type: data.type,
      miscCadSettingsId: cad.miscCadSettingsId,
    };

    await prisma.discordWebhook.upsert({
      where: { type: data.type },
      create: createUpdateData,
      update: createUpdateData,
    });

    await prisma.miscCadSettings.update({
      where: { id: cad.miscCadSettingsId },
      data: {
        [type as Key]: null,
      },
    });
  }
}
