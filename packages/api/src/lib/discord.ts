import fetch from "node-fetch";
import { APIWebhook } from "discord-api-types/payloads/v9/webhook";
import { RESTPostAPIWebhookWithTokenJSONBody } from "discord-api-types/rest/v9/webhook";

export async function getWebhookData(url: string): Promise<APIWebhook | null> {
  try {
    const res = await fetch(url);

    const header = res.headers.get("Content-Type");
    if (!header || header !== "application/json") {
      return null;
    }

    const data = await res.json();

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
  const DISCORD_API_URL = "https://discord.com/api/v9";

  if (!webhook) {
    return void undefined;
  }

  try {
    await fetch(`${DISCORD_API_URL}/webhooks/${webhook.id}/${webhook.token}`, {
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
