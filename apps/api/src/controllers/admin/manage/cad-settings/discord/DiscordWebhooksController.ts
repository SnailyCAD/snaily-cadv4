import process from "node:process";
import { BodyParams, Context, Controller, UseBeforeEach } from "@tsed/common";
import { ContentType, Get, Post } from "@tsed/schema";
import {
  APITextChannel,
  ChannelType,
  RESTGetAPIGuildChannelsResult,
  RESTGetAPIWebhookResult,
  Routes,
} from "discord-api-types/v10";
import { IsAuth } from "middlewares/is-auth";
import { prisma } from "lib/data/prisma";
import { cad, DiscordWebhook, DiscordWebhookType, MiscCadSettings, Rank } from "@prisma/client";
import { BadRequest } from "@tsed/exceptions";
import { DISCORD_WEBHOOKS_SCHEMA } from "@snailycad/schemas";
import { validateSchema } from "lib/data/validate-schema";
import type * as APITypes from "@snailycad/types/api";
import { resolve } from "node:path";
import { encodeFromFile } from "@snaily-cad/image-data-uri";
import { Permissions, UsePermissions } from "middlewares/use-permissions";
import { performDiscordRequest } from "lib/discord/performDiscordRequest";
import { AuditLogActionType } from "@snailycad/audit-logger";
import { createAuditLogEntry } from "@snailycad/audit-logger/server";
import { parseDiscordGuildIds } from "lib/discord/utils";

const guildId = process.env.DISCORD_SERVER_ID;

@UseBeforeEach(IsAuth)
@Controller("/admin/manage/cad-settings/discord/webhooks")
@ContentType("application/json")
export class DiscordWebhooksController {
  private async getDiscordChannels(guildIds: string[]) {
    const _channels: (RESTGetAPIGuildChannelsResult[number] & { guildId: string })[] = [];

    for (const guildId of guildIds) {
      try {
        const channels = await performDiscordRequest<RESTGetAPIGuildChannelsResult>({
          handler(rest) {
            return rest.get(Routes.guildChannels(guildId));
          },
        });

        const channelsWithGuildId = channels?.map((role) => ({ ...role, guildId })) ?? [];

        _channels.push(...channelsWithGuildId);
      } catch {
        continue;
      }
    }

    return _channels;
  }

  @Get("/")
  @UsePermissions({
    fallback: (u) => u.rank === Rank.OWNER,
    permissions: [Permissions.ManageCADSettings],
  })
  async getGuildChannels(@Context("cad") cad: cad): Promise<APITypes.GetCADDiscordWebhooksData> {
    if (!guildId) {
      throw new BadRequest("mustSetBotTokenGuildId");
    }

    const guildIds = parseDiscordGuildIds(guildId);
    const [channels, miscCadSettings] = await Promise.all([
      this.getDiscordChannels(guildIds),
      prisma.miscCadSettings.upsert({
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
  @UsePermissions({
    fallback: (u) => u.rank === Rank.OWNER,
    permissions: [Permissions.ManageCADSettings],
  })
  async setWebhookTypes(
    @Context("cad")
    cad: cad & { miscCadSettings: (MiscCadSettings & { webhooks?: DiscordWebhook[] }) | null },
    @BodyParams() body: unknown,
    @Context("sessionUserId") sessionUserId: string,
  ): Promise<APITypes.PostCADDiscordWebhooksData> {
    const name = cad.name || "SnailyCAD";

    if (!guildId) {
      throw new BadRequest("mustSetBotTokenGuildId");
    }

    const data = validateSchema(DISCORD_WEBHOOKS_SCHEMA, body);
    const channels = await this.getDiscordChannels(parseDiscordGuildIds(guildId));

    const values = Object.values(data);

    await Promise.all(
      values.map(async (webhookData) => {
        const prevWebhook = cad.miscCadSettings?.webhooks?.find((v) => v.type === webhookData.type);

        if (webhookData.id && !this.doesChannelExist(channels, webhookData.id)) {
          throw new BadRequest("invalidChannelId");
        }

        const webhook = await this.makeWebhookForChannel({
          channelId: webhookData.id,
          prevId: prevWebhook?.webhookId ?? null,
          name,
          iconId: cad.logoId,
        });

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

    await createAuditLogEntry({
      action: {
        type: AuditLogActionType.UpdateDiscordWebhooks,
        previous: cad.miscCadSettings?.webhooks ?? [],
        new: updatedCadSettings?.webhooks ?? [],
      },
      prisma,
      executorId: sessionUserId,
    });

    return updatedCadSettings!;
  }

  private doesChannelExist(arr: { id: string }[], id: string) {
    return arr.some((v) => v.id === id);
  }

  private async getCADImageDataURI(iconId: MakeWebhookForChannelOptions["iconId"]) {
    if (!iconId) return null;

    try {
      const path = resolve(process.cwd(), "public/cad", iconId);
      const dataURI = await encodeFromFile(path);

      return dataURI;
    } catch (e) {
      return null;
    }
  }

  private async makeWebhookForChannel({
    channelId,
    prevId,
    name,
    iconId,
  }: MakeWebhookForChannelOptions) {
    // delete previous webhook if exists.
    if ((prevId && !channelId) || (prevId && channelId !== prevId)) {
      await performDiscordRequest({
        async handler(rest) {
          await rest.delete(Routes.webhook(prevId));
        },
      });
    }

    if (!channelId) return null;

    const avatarURI = await this.getCADImageDataURI(iconId);

    // use pre-existing webhook if the channelId is the same.
    if (prevId && channelId === prevId) {
      const prevWebhookData = await performDiscordRequest<RESTGetAPIWebhookResult>({
        handler(rest) {
          return rest.get(Routes.webhook(prevId));
        },
      });

      if (prevWebhookData?.id) {
        await performDiscordRequest({
          async handler(rest) {
            rest.patch(Routes.webhook(prevId), {
              body: { name, avatar: avatarURI },
            });
          },
        });

        return { webhookId: prevWebhookData.id, channelId };
      }
    }

    const createdWebhook = await performDiscordRequest<RESTGetAPIWebhookResult>({
      handler(rest) {
        return rest.post(Routes.channelWebhooks(channelId), { body: { name, avatar: avatarURI } });
      },
    });

    if (!createdWebhook) {
      throw new BadRequest("unableToCreateWebhook");
    }

    return { webhookId: createdWebhook.id, channelId };
  }
}

interface MakeWebhookForChannelOptions {
  channelId: string | null | undefined;
  prevId: string | null;
  name: string;
  iconId: string | null;
}
