import type { DiscordWebhookType } from "@prisma/client";
import {
  type RESTGetAPIWebhookResult,
  type RESTPostAPIWebhookWithTokenJSONBody,
  Routes,
} from "discord-api-types/v10";
import { prisma } from "lib/data/prisma";
import { performDiscordRequest } from "./performDiscordRequest";
import { request } from "undici";

interface SendDiscordWebhookOptions {
  type: DiscordWebhookType;
  data: Partial<RESTPostAPIWebhookWithTokenJSONBody>;
  extraMessageData?: { userDiscordId?: string | null };
}

export async function sendDiscordWebhook(options: SendDiscordWebhookOptions) {
  try {
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
        return rest.post(Routes.webhook(webhookData.id, webhookData.token), {
          body: normalizedData,
        });
      },
    });
  } catch (err) {
    console.error("Could not send Discord webhook.", err);
  }
}

interface SendRawWebhookOptions {
  type: DiscordWebhookType;
  data: unknown;
}

export async function sendRawWebhook(options: SendRawWebhookOptions) {
  const webhook = await prisma.rawWebhook.findUnique({
    where: { type: options.type },
  });
  if (!webhook) return;

  try {
    await request(webhook.url, {
      method: "POST",
      body: JSON.stringify(options.data),
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Could not send Raw webhook.", error);
  }
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
