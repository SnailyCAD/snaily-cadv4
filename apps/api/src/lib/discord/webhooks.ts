import type { DiscordWebhookType } from "@prisma/client";
import {
  type RESTGetAPIWebhookResult,
  type RESTPostAPIWebhookWithTokenJSONBody,
  Routes,
} from "discord-api-types/v10";
import { prisma } from "lib/prisma";
import { performDiscordRequest } from "./performDiscordRequest";

export async function sendDiscordWebhook(
  type: DiscordWebhookType,
  data: Partial<RESTPostAPIWebhookWithTokenJSONBody>,
) {
  const webhook = await prisma.discordWebhook.findUnique({
    where: { type },
  });
  if (!webhook) return;

  const webhookData = await performDiscordRequest({
    async handler(rest) {
      if (!webhook.webhookId) return;

      const data = await rest.get(Routes.webhook(webhook.webhookId));
      return data as RESTGetAPIWebhookResult | null;
    },
  });

  if (!webhookData) return;

  const normalizedData: Partial<RESTPostAPIWebhookWithTokenJSONBody> = {
    ...data,
    content: webhook.extraMessage ?? undefined,
  };

  await performDiscordRequest({
    async handler(rest) {
      await rest.post(Routes.webhook(webhookData.id, webhookData.token), {
        body: normalizedData,
      });
    },
  });
}
