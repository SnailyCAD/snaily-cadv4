import { DiscordRole, Rank, User, WhitelistStatus } from "@snailycad/types";
import { APIGuildMember, Routes, type RESTGetAPIGuildMemberResult } from "discord-api-types/v10";
import { GUILD_ID } from "lib/discord/config";
import { prisma } from "lib/data/prisma";
import { manyToManyHelper } from "lib/data/many-to-many";
import { performDiscordRequest } from "./performDiscordRequest";

/**
 * fetch the roles from the wanting to authenticate user and append the respective permissions to the user
 */
export async function updateMemberRolesLogin<
  TUser extends Pick<
    User,
    "id" | "rank" | "discordId" | "whitelistStatus" | "permissions" | "roles"
  >,
>(user: TUser, discordRolesId: string | null) {
  try {
    if (!discordRolesId) return;

    const discordRoles = await prisma.discordRoles.findUnique({
      where: { id: String(discordRolesId) },
      include: {
        roles: true,
        leoRoles: true,
        emsFdRoles: true,
        dispatchRoles: true,
        towRoles: true,
        taxiRoles: true,
        leoSupervisorRoles: true,
        courthouseRoles: true,
      },
    });

    if (!discordRoles) return;

    const cad = await prisma.cad.findFirst();

    const discordMember = await performDiscordRequest<RESTGetAPIGuildMemberResult>({
      async handler(rest) {
        if (!GUILD_ID || !user.discordId) return null;
        return rest.get(Routes.guildMember(GUILD_ID, user.discordId));
      },
    });

    if (!discordMember?.user?.id || discordMember.pending) return;

    const isLeo = doesDiscordMemberHaveRole(discordRoles.leoRoles, discordMember.roles);
    const isEmsFd = doesDiscordMemberHaveRole(discordRoles.emsFdRoles, discordMember.roles);
    const isDispatch = doesDiscordMemberHaveRole(discordRoles.dispatchRoles, discordMember.roles);
    const isTow = doesDiscordMemberHaveRole(discordRoles.towRoles, discordMember.roles);
    const isTaxi = doesDiscordMemberHaveRole(discordRoles.taxiRoles, discordMember.roles);
    const isSupervisor = doesDiscordMemberHaveRole(
      discordRoles.leoSupervisorRoles,
      discordMember.roles,
    );
    const isCourthouse = doesDiscordMemberHaveRole(
      discordRoles.courthouseRoles,
      discordMember.roles,
    );
    const isAdmin = doesDiscordMemberHaveRole(discordRoles.adminRoleId, discordMember.roles);
    const hasWhitelistAccess = doesDiscordMemberHaveRole(
      discordRoles.whitelistedRoleId,
      discordMember.roles,
    );

    const grantablePermissions = {
      leo: { permissions: discordRoles.leoRolePermissions, value: isLeo },
      supervisor: { permissions: discordRoles.leoSupervisorRolePermissions, value: isSupervisor },
      emsFd: { permissions: discordRoles.emsFdRolePermissions, value: isEmsFd },
      dispatch: { permissions: discordRoles.dispatchRolePermissions, value: isDispatch },
      tow: { permissions: discordRoles.towRolePermissions, value: isTow },
      taxi: { permissions: discordRoles.taxiRolePermissions, value: isTaxi },
      courthouse: { permissions: discordRoles.courthouseRolePermissions, value: isCourthouse },
      admin: { permissions: discordRoles.adminRolePermissions, value: isAdmin },
    } as const;

    const permissionsToGive = [];
    for (const _key in grantablePermissions) {
      const key = _key as keyof typeof grantablePermissions;
      const { value, permissions } = grantablePermissions[key];
      const correctedPermissions = permissions.map((p) => p.replace(/ +/g, ""));

      if (value === true) {
        correctedPermissions.length && permissionsToGive.push(...correctedPermissions);
      } else {
        user.permissions = user.permissions.filter((v) => !correctedPermissions.includes(v));
      }
    }

    const customRoles = await getCustomRoleDiscordRolesByDiscordMember(discordMember);
    const mergedPermissions = [...new Set([...user.permissions, ...permissionsToGive])];

    const disconnectConnectArray = manyToManyHelper(
      user.roles?.map((v) => v.id) ?? [],
      customRoles.map((v) => v.id),
    );

    await Promise.all(
      disconnectConnectArray.map((v) =>
        prisma.user.update({ where: { id: user.id }, data: { roles: v } }),
      ),
    );

    const updateData = {
      permissions: user.rank === Rank.OWNER ? [] : mergedPermissions,
      whitelistStatus: makeWhitelistStatus(cad?.whitelisted ?? false, hasWhitelistAccess),
      rank:
        user.rank !== Rank.OWNER
          ? doesDiscordMemberHaveRole(discordRoles.adminRoleId, discordMember.roles)
            ? Rank.ADMIN
            : Rank.USER
          : undefined,
    };

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return updatedUser;
  } catch {
    return user;
  }
}

function doesDiscordMemberHaveRole(
  cadRoles: DiscordRole[] | string | null,
  discordMemberRoleIds: string[],
) {
  if (!cadRoles) return undefined;

  if (Array.isArray(cadRoles)) {
    if (cadRoles.length <= 0) return undefined;
    return cadRoles.some((role) => discordMemberRoleIds.includes(role.id));
  }

  return discordMemberRoleIds.includes(cadRoles);
}

function makeWhitelistStatus(cadWhitelisted: boolean, hasRole: boolean | undefined) {
  if (!cadWhitelisted || typeof hasRole === "undefined") {
    return undefined;
  }

  return hasRole ? WhitelistStatus.ACCEPTED : WhitelistStatus.PENDING;
}

async function getCustomRoleDiscordRolesByDiscordMember(discordMember: APIGuildMember) {
  const orClause = discordMember.roles.map((id) => ({ discordRoleId: id }));

  const customRoles = await prisma.customRole.findMany({
    where: { OR: orClause },
  });

  return customRoles;
}
