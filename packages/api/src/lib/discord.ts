import { request } from "undici";
import type { APIWebhook } from "discord-api-types/payloads/v9/webhook";
import type { RESTPostAPIWebhookWithTokenJSONBody } from "discord-api-types/rest/v9/webhook";
import { Routes } from "discord-api-types";

export const DISCORD_API_VERSION = "v9";
export const DISCORD_API_URL = `https://discord.com/api/${DISCORD_API_VERSION}`;

export async function getWebhookData(url: string): Promise<APIWebhook | null> {
  try {
    const res = await request(url, { method: "GET" });

    const header = res.headers["content-type"];
    if (!header || header !== "application/json") {
      return null;
    }

    const data = await res.body.json();

    return {
      type: data.type,
      id: data.id,
      token: data.token,
      name: data.name,
      avatar: data.avatar_url ?? null,
      channel_id: data.channel_id,
      guild_id: data.guild_id,
      application_id: data.application_id,
    };
  } catch (e) {
    console.error({ e });

    return null;
  }
}

export async function sendDiscordWebhook(
  webhook: APIWebhook | null,
  data: Partial<RESTPostAPIWebhookWithTokenJSONBody> | any,
): Promise<void> {
  if (!webhook) {
    return void undefined;
  }

  try {
    await request(`${DISCORD_API_URL}${Routes.webhook(webhook.id, webhook.token)}`, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (e) {
    console.error({ e });
  }
}
