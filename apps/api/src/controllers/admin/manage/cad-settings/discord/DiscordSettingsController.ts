import process from "node:process";
import { BodyParams, Context, Controller, UseBeforeEach } from "@tsed/common";
import { ContentType, Get, Post } from "@tsed/schema";
import { RESTGetAPIGuildRolesResult, Routes } from "discord-api-types/v10";
import { IsAuth } from "middlewares/is-auth";
import { prisma } from "lib/data/prisma";
import { Rank, cad, DiscordRole } from "@prisma/client";
import { BadRequest } from "@tsed/exceptions";
import { DISCORD_SETTINGS_SCHEMA } from "@snailycad/schemas";
import { validateSchema } from "lib/data/validate-schema";
import { manyToManyHelper } from "lib/data/many-to-many";
import type * as APITypes from "@snailycad/types/api";
import { Permissions } from "@snailycad/permissions";
import { UsePermissions } from "middlewares/use-permissions";
import { performDiscordRequest } from "lib/discord/performDiscordRequest";
import { AuditLogActionType, createAuditLogEntry } from "@snailycad/audit-logger/server";
import { parseDiscordGuildIds } from "lib/discord/utils";

const guildId = process.env.DISCORD_SERVER_ID;

@UseBeforeEach(IsAuth)
@Controller("/admin/manage/cad-settings/discord/roles")
@ContentType("application/json")
export class DiscordSettingsController {
  private async getDiscordRoles(guildIds: string[]) {
    const _roles: (RESTGetAPIGuildRolesResult[number] & { guildId: string })[] = [];

    for (const guildId of guildIds) {
      try {
        const roles = await performDiscordRequest<RESTGetAPIGuildRolesResult>({
          handler(rest) {
            return rest.get(Routes.guildRoles(guildId));
          },
        });

        const rolesWithGuildId = roles?.map((role) => ({ ...role, guildId })) ?? [];

        _roles.push(...rolesWithGuildId);
      } catch {
        continue;
      }
    }

    return _roles;
  }

  @Get("/")
  async getGuildRoles(@Context("cad") cad: cad): Promise<APITypes.GetCADDiscordRolesData> {
    if (!guildId) {
      throw new BadRequest("mustSetBotTokenGuildId");
    }

    const guildIds = parseDiscordGuildIds(guildId);
    const roles = await this.getDiscordRoles(guildIds);

    const discordRoles = await prisma.discordRoles.upsert({
      where: { id: String(cad.discordRolesId) },
      update: { guildId },
      create: { guildId },
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
          guildId: role.guildId,
        },
        update: {
          name: role.name,
          discordRolesId: discordRoles.id,
          guildId: role.guildId,
        },
      });

      data.push(discordRole);
    }

    return data;
  }

  @Post("/")
  @UsePermissions({
    fallback: (u) => u.rank === Rank.OWNER,
    permissions: [Permissions.ManageCADSettings],
  })
  async setRoleTypes(
    @Context("cad") cad: cad,
    @BodyParams() body: unknown,
    @Context("sessionUserId") sessionUserId: string,
  ): Promise<APITypes.PostCADDiscordRolesData> {
    if (!guildId) {
      throw new BadRequest("mustSetBotTokenGuildId");
    }

    const data = validateSchema(DISCORD_SETTINGS_SCHEMA, body);
    const roles = await this.getDiscordRoles(parseDiscordGuildIds(guildId));

    const rolesToCheck = {
      leoRoles: data.leoRoles,
      emsFdRoles: data.emsFdRoles,
      leoSupervisorRoles: data.leoSupervisorRoles,
      dispatchRoles: data.dispatchRoles,
      courthouseRoles: data.courthouseRoles,
      towRoles: data.towRoles,
      taxiRoles: data.taxiRoles,
      adminRoleId: data.adminRoleId,
      whitelistedRoleId: data.whitelistedRoleId,
    };

    Object.values(rolesToCheck).map((roleId) => {
      if (Array.isArray(roleId) && roleId.length <= 0) return;

      if (roleId && !this.doesRoleExist(roles, roleId)) {
        throw new BadRequest("invalidRoleId");
      }
    });

    const createUpdateData = {
      guildId,
      adminRoleId: data.adminRoleId ?? null,
      whitelistedRoleId: data.whitelistedRoleId ?? null,
      adminRolePermissions: data.adminRolePermissions ?? [],
      leoRolePermissions: data.leoRolePermissions ?? [],
      leoSupervisorRolePermissions: data.leoSupervisorRolePermissions ?? [],
      emsFdRolePermissions: data.emsFdRolePermissions ?? [],
      dispatchRolePermissions: data.dispatchRolePermissions ?? [],
      towRolePermissions: data.towRolePermissions ?? [],
      taxiRolePermissions: data.taxiRolePermissions ?? [],
      courthouseRolePermissions: data.courthouseRolePermissions ?? [],
    };

    const discordRoles = await prisma.discordRoles.upsert({
      where: { id: String(cad.discordRolesId) },
      update: createUpdateData,
      create: createUpdateData,
      include: {
        adminRoles: true,
        leoRoles: true,
        emsFdRoles: true,
        leoSupervisorRoles: true,
        towRoles: true,
        taxiRoles: true,
        dispatchRoles: true,
        courthouseRoles: true,
      },
    });

    await Promise.all([
      this.updateRoles({
        discordRoleId: discordRoles.id,
        discordRoles: discordRoles.adminRoles,
        newRoles: (data.adminRoles as string[] | null) ?? [],
        type: "adminRoles",
      }),
      this.updateRoles({
        discordRoleId: discordRoles.id,
        discordRoles: discordRoles.leoRoles,
        newRoles: (data.leoRoles as string[] | null) ?? [],
        type: "leoRoles",
      }),
      this.updateRoles({
        discordRoleId: discordRoles.id,
        discordRoles: discordRoles.emsFdRoles,
        newRoles: (data.emsFdRoles as string[] | null) ?? [],
        type: "emsFdRoles",
      }),
      this.updateRoles({
        discordRoleId: discordRoles.id,
        discordRoles: discordRoles.leoSupervisorRoles,
        newRoles: (data.leoSupervisorRoles as string[] | null) ?? [],
        type: "leoSupervisorRoles",
      }),
      this.updateRoles({
        discordRoleId: discordRoles.id,
        discordRoles: discordRoles.towRoles,
        newRoles: (data.towRoles as string[] | null) ?? [],
        type: "towRoles",
      }),
      this.updateRoles({
        discordRoleId: discordRoles.id,
        discordRoles: discordRoles.dispatchRoles,
        newRoles: (data.dispatchRoles as string[] | null) ?? [],
        type: "dispatchRoles",
      }),
      this.updateRoles({
        discordRoleId: discordRoles.id,
        discordRoles: discordRoles.taxiRoles,
        newRoles: (data.taxiRoles as string[] | null) ?? [],
        type: "taxiRoles",
      }),
      this.updateRoles({
        discordRoleId: discordRoles.id,
        discordRoles: discordRoles.courthouseRoles,
        newRoles: (data.courthouseRoles as string[] | null) ?? [],
        type: "courthouseRoles",
      }),
    ]);

    const updated = await prisma.cad.update({
      where: { id: cad.id },
      data: { discordRolesId: discordRoles.id },
      include: {
        discordRoles: {
          include: {
            roles: true,
            adminRoles: true,
            leoRoles: true,
            emsFdRoles: true,
            leoSupervisorRoles: true,
            towRoles: true,
            taxiRoles: true,
            dispatchRoles: true,
            courthouseRoles: true,
          },
        },
      },
    });

    await createAuditLogEntry({
      action: {
        type: AuditLogActionType.UpdateDiscordRoles,
        previous: discordRoles,
        new: updated.discordRoles!,
      },
      prisma,
      executorId: sessionUserId,
    });

    return updated.discordRoles!;
  }

  private doesRoleExist(roles: { id: string }[], roleId: string | string[]) {
    return roles.some((v) =>
      typeof roleId === "string" ? v.id === roleId : roleId.includes(v.id),
    );
  }

  private async updateRoles(options: UpdateRolesOptions) {
    const disconnectConnectArr = manyToManyHelper(
      options.discordRoles.map((v) => v.id),
      options.newRoles,
    );

    await prisma.$transaction(
      disconnectConnectArr.map((v) =>
        prisma.discordRoles.update({
          where: { id: options.discordRoleId },
          data: { [options.type]: v },
        }),
      ),
    );
  }
}

interface UpdateRolesOptions {
  discordRoleId: string;
  discordRoles: DiscordRole[];
  newRoles: string[];
  type:
    | "leoRoles"
    | "emsFdRoles"
    | "leoSupervisorRoles"
    | "dispatchRoles"
    | "towRoles"
    | "taxiRoles"
    | "courthouseRoles"
    | "adminRoles";
}
