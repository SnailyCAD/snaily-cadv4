import process from "node:process";
import { Context, Controller, UseBeforeEach } from "@tsed/common";
import { Get } from "@tsed/schema";
import { request } from "undici";
import { Routes } from "discord-api-types/v9";
import { IsAuth } from "middlewares/IsAuth";
import { prisma } from "lib/prisma";
import type { cad } from "@prisma/client";
import { BadRequest } from "@tsed/exceptions";

const DISCORD_API_VERSION = "v9";
const guildId = process.env.DISCORD_SERVER_ID;
const botToken = process.env.DISCORD_BOT_TOKEN;
const discordApiUrl = `https://discord.com/api/${DISCORD_API_VERSION}`;

@Controller("/admin/manage/cad-settings/discord")
@UseBeforeEach(IsAuth)
export class DiscordSettingsController {
  @Get("/")
  async getGuildRoles(@Context("cad") cad: cad) {
    if (!guildId || !botToken) {
      throw new BadRequest(
        // todo: add link
        "Must set `DISCORD_BOT_TOKEN` and `DISCORD_SERVER_ID` in .env file. See docs: ",
      );
    }

    const roles = await request(`${discordApiUrl}${Routes.guildRoles(guildId)}`, {
      method: "GET",
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    });

    const discordRoles = await prisma.discordRoles.upsert({
      where: { id: String(cad.discordRolesId) },
      update: { guildId },
      create: {
        guildId,
      },
    });

    const body = await roles.body.json();
    const bodyArr = Array.isArray(body) ? body : [];

    const data = [];

    for (const role of bodyArr) {
      if (role.name === "@everyone") continue;

      const discordRole = await prisma.discordRole.upsert({
        where: { id: role.id },
        create: {
          name: role.name,
          id: role.id,
          discordRolesId: discordRoles.id,
        },
        update: {
          name: role.name,
        },
      });

      data.push(discordRole);
    }

    return data;
  }
}
