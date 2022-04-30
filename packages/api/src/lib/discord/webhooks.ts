import type { DiscordWebhookType } from "@prisma/client";
import {
  type RESTGetAPIWebhookResult,
  type RESTPostAPIWebhookWithTokenJSONBody,
  Routes,
} from "discord-api-types/v10";
import { getRest } from "lib/discord/config";
import { prisma } from "lib/prisma";

export async function sendDiscordWebhook(
  type: DiscordWebhookType,
  data: Partial<RESTPostAPIWebhookWithTokenJSONBody>,
) {
  const webhook = await prisma.discordWebhook.findUnique({
    where: { type },
  });

  if (!webhook || !webhook.webhookId) return;

  const rest = getRest();

  const webhookData = (await rest
    .get(Routes.webhook(webhook.webhookId))
    .catch(() => null)) as RESTGetAPIWebhookResult | null;

  if (!webhookData) return;

  const normalizedData: Partial<RESTPostAPIWebhookWithTokenJSONBody> = {
    ...data,
    content: webhook.extraMessage ?? undefined,
  };
  await rest.post(Routes.webhook(webhookData.id, webhookData.token), {
    body: normalizedData,
  });
}
