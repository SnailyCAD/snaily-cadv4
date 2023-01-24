import type { DiscordWebhookType } from "@prisma/client";
import {
  type RESTGetAPIWebhookResult,
  type RESTPostAPIWebhookWithTokenJSONBody,
  Routes,
} from "discord-api-types/v10";
import { prisma } from "lib/data/prisma";
import { performDiscordRequest } from "./performDiscordRequest";

interface SendDiscordWebhookOptions {
  type: DiscordWebhookType;
  data: Partial<RESTPostAPIWebhookWithTokenJSONBody>;
  extraMessageData?: { userDiscordId?: string | null };
}

export async function sendDiscordWebhook(options: SendDiscordWebhookOptions) {
  const webhook = await prisma.discordWebhook.findUnique({
    where: { type: options.type },
  });
  if (!webhook) return;

  const webhookData = await performDiscordRequest<RESTGetAPIWebhookResult>({
    async handler(rest) {
      if (!webhook.webhookId) return null;
      return rest.get(Routes.webhook(webhook.webhookId));
    },
  });

  if (!webhookData) return;

  const normalizedData: Partial<RESTPostAPIWebhookWithTokenJSONBody> = {
    ...options.data,
    content: formatExtraMessage({ ...options, ...webhook }) ?? undefined,
  };

  await performDiscordRequest({
    async handler(rest) {
      rest.post(Routes.webhook(webhookData.id, webhookData.token), {
        body: normalizedData,
      });
    },
  });
}

function formatExtraMessage(
  options: Pick<SendDiscordWebhookOptions, "extraMessageData"> & { extraMessage?: string | null },
) {
  if (!options.extraMessage) return undefined;
  if (!options.extraMessageData) return options.extraMessage;

  const userDiscordId = options.extraMessageData.userDiscordId;
  const userMention = userDiscordId ? `<@${userDiscordId}>` : "Unknown User";
  const userIdRegex = /\{userId\}/;

  const newMessage = options.extraMessage.replace(userIdRegex, userMention);
  return newMessage;
}
