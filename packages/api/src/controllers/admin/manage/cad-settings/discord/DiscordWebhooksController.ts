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
import type { cad, MiscCadSettings } from "@prisma/client";
import { BadRequest } from "@tsed/exceptions";
import { DISCORD_WEBHOOKS_SCHEMA } from "@snailycad/schemas";
import { validateSchema } from "lib/validateSchema";
import { getRest } from "lib/discord/config";

const guildId = process.env.DISCORD_SERVER_ID;

@Controller("/admin/manage/cad-settings/discord/webhooks")
@UseBeforeEach(IsAuth)
export class DiscordWebhooksController {
  @Get("/")
  async getGuildChannels(@Context("cad") cad: cad) {
    if (!guildId) {
      throw new BadRequest("mustSetBotTokenGuildId");
    }

    const rest = getRest();
    const channels = (await rest.get(
      Routes.guildChannels(guildId),
    )) as RESTGetAPIGuildChannelsResult | null;

    const miscCadSettings = await prisma.miscCadSettings.upsert({
      where: { id: String(cad.miscCadSettingsId) },
      update: {},
      create: {},
    });

    await prisma.cad.update({
      where: { id: cad.id },
      data: { miscCadSettingsId: miscCadSettings.id },
    });

    const channelsBody = Array.isArray(channels) ? channels : [];
    const data: Pick<APITextChannel, "id" | "name">[] = [];

    for (const channel of channelsBody) {
      if (channel.type !== ChannelType.GuildText) continue;

      data.push({
        name: channel.name,
        id: channel.id,
      });
    }

    return data;
  }

  @Post("/")
  async setRoleTypes(
    @Context("cad") cad: cad & { miscCadSettings: MiscCadSettings },
    @BodyParams() body: unknown,
  ) {
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

    Object.values(data).map((channelId) => {
      if (channelId && !this.doesChannelExist(channelsBody, channelId)) {
        throw new BadRequest("invalidChannelId");
      }
    });

    const createUpdateData = {
      statusesWebhookId: await this.makeWebhookForChannel(
        data.statusesWebhookId,
        cad.miscCadSettings.statusesWebhookId,
        name,
      ),
      call911WebhookId: await this.makeWebhookForChannel(
        data.call911WebhookId,
        cad.miscCadSettings.call911WebhookId,
        name,
      ),
      panicButtonWebhookId: await this.makeWebhookForChannel(
        data.panicButtonWebhookId,
        cad.miscCadSettings.panicButtonWebhookId,
        name,
      ),
      boloWebhookId: await this.makeWebhookForChannel(
        data.boloWebhookId,
        cad.miscCadSettings.boloWebhookId,
        name,
      ),
    };

    const miscCadSettings = await prisma.miscCadSettings.upsert({
      where: { id: String(cad.miscCadSettingsId) },
      update: createUpdateData,
      create: createUpdateData,
    });

    await prisma.cad.update({
      where: { id: cad.id },
      data: { miscCadSettingsId: miscCadSettings.id },
    });

    return miscCadSettings;
  }

  protected doesChannelExist(arr: { id: string }[], id: string) {
    return arr.some((v) => v.id === id);
  }

  protected async makeWebhookForChannel(
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
        return prevWebhookData.id;
      }
    }

    const createdWebhook = (await rest.post(Routes.channelWebhooks(channelId), {
      body: {
        name,
      },
    })) as RESTGetAPIWebhookResult;

    return createdWebhook.id;
  }
}
