import type { MiscCadSettings } from "@snailycad/types";
import {
  type RESTGetAPIWebhookResult,
  type RESTPostAPIWebhookWithTokenJSONBody,
  Routes,
} from "discord-api-types/v10";
import { getRest } from "lib/discord/config";

export async function sendDiscordWebhook(
  miscCadSettings: MiscCadSettings | null,
  type: keyof Pick<MiscCadSettings, "call911WebhookId" | "statusesWebhookId">,
  data: Partial<RESTPostAPIWebhookWithTokenJSONBody>,
) {
  const id = miscCadSettings?.[type];
  if (!id) return;

  const rest = getRest();

  const webhookData = (await rest
    .get(Routes.webhook(id))
    .catch(() => null)) as RESTGetAPIWebhookResult | null;

  if (!webhookData) return;
  data;

  await rest.post(Routes.webhook(webhookData.id, webhookData.token), {
    body: data,
  });
}
