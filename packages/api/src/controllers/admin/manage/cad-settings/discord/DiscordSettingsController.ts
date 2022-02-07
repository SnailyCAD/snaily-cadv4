import process from "node:process";
import { BodyParams, Context, Controller, UseBeforeEach } from "@tsed/common";
import { Get, Post } from "@tsed/schema";
import { request } from "undici";
import { Routes } from "discord-api-types/v9";
import { IsAuth } from "middlewares/IsAuth";
import { prisma } from "lib/prisma";
import type { cad } from "@prisma/client";
import { BadRequest } from "@tsed/exceptions";
import { DISCORD_SETTINGS_SCHEMA } from "@snailycad/schemas";
import { validateSchema } from "lib/validateSchema";
import { DISCORD_API_URL } from "lib/discord";

const guildId = process.env.DISCORD_SERVER_ID;
const botToken = process.env.DISCORD_BOT_TOKEN;

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

    const roles = await request(`${DISCORD_API_URL}${Routes.guildRoles(guildId)}`, {
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

  @Post("/")
  async setRoleTypes(@Context("cad") cad: cad, @BodyParams() body: unknown) {
    const data = validateSchema(DISCORD_SETTINGS_SCHEMA, body);

    if (!guildId || !botToken) {
      throw new BadRequest(
        // todo: add link
        "Must set `DISCORD_BOT_TOKEN` and `DISCORD_SERVER_ID` in .env file. See docs: ",
      );
    }

    const roles = await request(`${DISCORD_API_URL}${Routes.guildRoles(guildId)}`, {
      method: "GET",
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    });
    const rolesBody = await roles.body.json();

    Object.values(data).map((roleId) => {
      if (roleId && !this.doesRoleExist(rolesBody, roleId)) {
        throw new BadRequest("invalidRoleId");
      }
    });

    const createUpdateData = {
      guildId,
      dispatchRoleId: data.dispatchRoleId ?? null,
      leoRoleId: data.leoRoleId ?? null,
      emsFdRoleId: data.emsFdRoleId ?? null,
    };

    const discordRoles = await prisma.discordRoles.upsert({
      where: { id: String(cad.discordRolesId) },
      update: createUpdateData,
      create: createUpdateData,
    });

    return discordRoles;
  }

  protected doesRoleExist(roles: { id: string }[], roleId: string) {
    return roles.some((v) => v.id === roleId);
  }
}
