import process from "node:process";
import { BodyParams, Context, Controller, UseBeforeEach } from "@tsed/common";
import { Get, Post } from "@tsed/schema";
import { RESTGetAPIGuildRolesResult, Routes } from "discord-api-types/v10";
import { IsAuth } from "middlewares/IsAuth";
import { prisma } from "lib/prisma";
import type { cad } from "@prisma/client";
import { BadRequest } from "@tsed/exceptions";
import { DISCORD_SETTINGS_SCHEMA } from "@snailycad/schemas";
import { validateSchema } from "lib/validateSchema";
import { getRest } from "lib/discord";

const guildId = process.env.DISCORD_SERVER_ID;

@Controller("/admin/manage/cad-settings/discord")
@UseBeforeEach(IsAuth)
export class DiscordSettingsController {
  @Get("/")
  async getGuildRoles(@Context("cad") cad: cad) {
    if (!guildId) {
      throw new BadRequest("mustSetBotTokenGuildId");
    }

    const rest = getRest();
    const roles = (await rest.get(Routes.guildRoles(guildId))) as RESTGetAPIGuildRolesResult | null;

    const discordRoles = await prisma.discordRoles.upsert({
      where: { id: String(cad.discordRolesId) },
      update: { guildId },
      create: {
        guildId,
      },
    });

    await prisma.cad.update({
      where: { id: cad.id },
      data: { discordRolesId: discordRoles.id },
    });

    const rolesBody = Array.isArray(roles) ? roles : [];
    const data = [];

    for (const role of rolesBody) {
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
          discordRolesId: discordRoles.id,
        },
      });

      data.push(discordRole);
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
