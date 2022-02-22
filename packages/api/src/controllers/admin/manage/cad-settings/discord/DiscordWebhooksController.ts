import process from "node:process";
import { BodyParams, Context, Controller, UseBeforeEach } from "@tsed/common";
import { Get, Post } from "@tsed/schema";
import {
  APITextChannel,
  ChannelType,
  RESTGetAPIGuildChannelsResult,
  RESTGetAPIGuildRolesResult,
  Routes,
} from "discord-api-types/v10";
import { IsAuth } from "middlewares/IsAuth";
import { prisma } from "lib/prisma";
import type { cad } from "@prisma/client";
import { BadRequest } from "@tsed/exceptions";
import { DISCORD_SETTINGS_SCHEMA } from "@snailycad/schemas";
import { validateSchema } from "lib/validateSchema";
import { getRest } from "lib/discord";

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
  async setRoleTypes(@Context("cad") cad: cad, @BodyParams() body: unknown) {
    if (!guildId) {
      throw new BadRequest("mustSetBotTokenGuildId");
    }

    const data = validateSchema(DISCORD_SETTINGS_SCHEMA, body);

    const rest = getRest();
    const roles = (await rest.get(Routes.guildRoles(guildId))) as RESTGetAPIGuildRolesResult | null;

    const rolesBody = Array.isArray(roles) ? roles : [];

    Object.values(data).map((roleId) => {
      if (roleId && !this.doesRoleExist(rolesBody, roleId)) {
        throw new BadRequest("invalidRoleId");
      }
    });

    const createUpdateData = {
      guildId,
      dispatchRoleId: data.dispatchRoleId ?? null,
      leoRoleId: data.leoRoleId ?? null,
      leoSupervisorRoleId: data.leoSupervisorRoleId ?? null,
      emsFdRoleId: data.emsFdRoleId ?? null,
      towRoleId: data.towRoleId ?? null,
      taxiRoleId: data.taxiRoleId ?? null,
      adminRoleId: data.adminRoleId ?? null,
      whitelistedRoleId: data.whitelistedRoleId ?? null,
    };

    const discordRoles = await prisma.discordRoles.upsert({
      where: { id: String(cad.discordRolesId) },
      update: createUpdateData,
      create: createUpdateData,
    });

    await prisma.cad.update({
      where: { id: cad.id },
      data: { discordRolesId: discordRoles.id },
    });

    return discordRoles;
  }

  protected doesRoleExist(roles: { id: string }[], roleId: string) {
    return roles.some((v) => v.id === roleId);
  }
}
