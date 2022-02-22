import process from "process";
import { request } from "undici";
import type { APIWebhook } from "discord-api-types/payloads/v10/webhook";
import type { RESTPostAPIWebhookWithTokenJSONBody } from "discord-api-types/rest/v10/webhook";
import { Routes } from "discord-api-types/v10";
import { REST } from "@discordjs/rest";

export const DISCORD_API_VERSION = "v10";
export const DISCORD_API_URL = `https://discord.com/api/${DISCORD_API_VERSION}`;
export const GUILD_ID = process.env.DISCORD_SERVER_ID;
export const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

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

let cacheREST;
export function getRest(): REST {
  if (!BOT_TOKEN) {
    throw new Error("mustSetBotTokenGuildId");
  }
  return (cacheREST ??= new REST({ version: "10" }).setToken(BOT_TOKEN));
}
