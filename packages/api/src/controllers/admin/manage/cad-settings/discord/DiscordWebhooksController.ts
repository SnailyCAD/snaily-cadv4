import process from "node:process";
import { BodyParams, Context, Controller, UseBeforeEach } from "@tsed/common";
import { Get, Post } from "@tsed/schema";
import {
  APITextChannel,
  ChannelType,
  RESTGetAPIGuildChannelsResult,
  RESTGetAPIWebhookResult,
  Routes,
} from "discord-api-types/v10";
import { IsAuth } from "middlewares/IsAuth";
import { prisma } from "lib/prisma";
import type { cad, DiscordWebhook, DiscordWebhookType, MiscCadSettings } from "@prisma/client";
import { BadRequest } from "@tsed/exceptions";
import { DISCORD_WEBHOOKS_SCHEMA } from "@snailycad/schemas";
import { validateSchema } from "lib/validateSchema";
import { getRest } from "lib/discord/config";
import type * as APITypes from "@snailycad/types/api";

const guildId = process.env.DISCORD_SERVER_ID;

@UseBeforeEach(IsAuth)
@Controller("/admin/manage/cad-settings/discord/webhooks")
export class DiscordWebhooksController {
  @Get("/")
  async getGuildChannels(@Context("cad") cad: cad): Promise<APITypes.GetCADDiscordWebhooksData> {
    if (!guildId) {
      throw new BadRequest("mustSetBotTokenGuildId");
    }

    const rest = getRest();
    const [channels, miscCadSettings] = await Promise.all([
      (await rest.get(Routes.guildChannels(guildId))) as RESTGetAPIGuildChannelsResult | null,
      await prisma.miscCadSettings.upsert({
        where: { id: String(cad.miscCadSettingsId) },
        update: {},
        create: {},
      }),
    ]);

    await prisma.cad.update({
      where: { id: cad.id },
      data: { miscCadSettingsId: miscCadSettings.id },
    });

    const channelsBody = Array.isArray(channels) ? channels : [];
    const data: Required<Pick<APITextChannel, "id" | "name">>[] = [];

    for (const channel of channelsBody) {
      if (channel.type !== ChannelType.GuildText) continue;
      if (!channel.name) continue;

      data.push({
        name: channel.name,
        id: channel.id,
      });
    }

    return data;
  }

  @Post("/")
  async setRoleTypes(
    @Context("cad")
    cad: cad & { miscCadSettings: MiscCadSettings & { webhooks: DiscordWebhook[] } },
    @BodyParams() body: unknown,
  ): Promise<APITypes.PostCADDiscordWebhooksData> {
    const name = cad.name || "SnailyCAD";

    if (!guildId) {
      throw new BadRequest("mustSetBotTokenGuildId");
    }

    const data = validateSchema(DISCORD_WEBHOOKS_SCHEMA, body);

    const rest = getRest();
    const channels = (await rest.get(
      Routes.guildChannels(guildId),
    )) as RESTGetAPIGuildChannelsResult | null;

    const channelsBody = Array.isArray(channels) ? channels : [];
    const entries = Object.entries(data);

    await Promise.all(
      entries.map(async ([, webhookData]) => {
        const prevWebhook = cad.miscCadSettings.webhooks.find((v) => v.type === webhookData.type);

        if (webhookData.id && !this.doesChannelExist(channelsBody, webhookData.id)) {
          throw new BadRequest("invalidChannelId");
        }

        const webhook = await this.makeWebhookForChannel(
          webhookData.id,
          prevWebhook?.webhookId ?? null,
          name,
        );

        if (!webhook) {
          await prisma.discordWebhook.deleteMany({
            where: { type: webhookData.type as DiscordWebhookType },
          });
          return;
        }

        const createUpdateData = {
          channelId: webhook.channelId,
          type: webhookData.type as DiscordWebhookType,
          extraMessage: webhookData.extraMessage,
          miscCadSettingsId: cad.miscCadSettingsId!,
          webhookId: webhook.webhookId,
        };

        await prisma.discordWebhook.upsert({
          where: { type: webhookData.type as DiscordWebhookType },
          create: createUpdateData,
          update: createUpdateData,
        });
      }),
    );

    const updatedCadSettings = await prisma.miscCadSettings.findUnique({
      where: { id: cad.miscCadSettingsId! },
      include: { webhooks: true },
    });

    return updatedCadSettings!;
  }

  private doesChannelExist(arr: { id: string }[], id: string) {
    return arr.some((v) => v.id === id);
  }

  private async makeWebhookForChannel(
    channelId: string | null | undefined,
    prevId: string | null,
    name: string,
  ) {
    const rest = getRest();

    // delete previous webhook if exists.
    if ((prevId && !channelId) || (prevId && channelId !== prevId)) {
      await rest.delete(Routes.webhook(prevId)).catch(() => null);
    }

    if (!channelId) return null;

    // use pre-existing webhook if the channelId is the same.
    if (prevId && channelId === prevId) {
      const prevWebhookData = (await rest
        .get(Routes.webhook(prevId))
        .catch(() => null)) as RESTGetAPIWebhookResult | null;

      if (prevWebhookData?.id) {
        return { webhookId: prevWebhookData.id, channelId };
      }
    }

    const createdWebhook = (await rest.post(Routes.channelWebhooks(channelId), {
      body: { name },
    })) as RESTGetAPIWebhookResult;

    return { webhookId: createdWebhook.id, channelId };
  }
}
