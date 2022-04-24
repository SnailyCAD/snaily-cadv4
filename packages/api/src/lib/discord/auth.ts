import { DiscordRole, Rank, User, WhitelistStatus } from "@prisma/client";
import { Routes, type RESTGetAPIGuildMemberResult } from "discord-api-types/v10";
import { getRest, GUILD_ID } from "lib/discord/config";
import { prisma } from "lib/prisma";
import { merge } from "utils/manyToMany";

/**
 * fetch the roles from the wanting to authenticate user and append the respective permissions to the user
 */
export async function updateMemberRolesLogin(
  user: Pick<User, "id" | "rank" | "discordId" | "whitelistStatus" | "permissions">,
  discordRolesId: string | null,
) {
  if (!GUILD_ID || !discordRolesId || !user.discordId) return;

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
    },
  });

  if (!discordRoles) return;
  const rest = getRest();

  const cad = await prisma.cad.findFirst();

  const discordMember = (await rest.get(
    Routes.guildMember(GUILD_ID, user.discordId),
  )) as RESTGetAPIGuildMemberResult | null;

  if (!discordMember?.user?.id || discordMember.pending) return;

  const isLeo = hasRoleArr(discordRoles.leoRoles, discordMember.roles);
  const isEmsFd = hasRoleArr(discordRoles.emsFdRoles, discordMember.roles);
  const isDispatch = hasRoleArr(discordRoles.dispatchRoles, discordMember.roles);
  const isTow = hasRoleArr(discordRoles.towRoles, discordMember.roles);
  const isTaxi = hasRoleArr(discordRoles.taxiRoles, discordMember.roles);
  const isSupervisor = hasRoleArr(discordRoles.leoSupervisorRoles, discordMember.roles);
  const isAdmin = hasRole(discordRoles.adminRoleId, discordMember.roles);

  const permissions = {
    isLeo: discordRoles.leoRolePermissions,
    isSupervisor: discordRoles.leoSupervisorRolePermissions,
    isEmsFd: discordRoles.emsFdRolePermissions,
    isDispatch: discordRoles.dispatchRolePermissions,
    isTow: discordRoles.towRolePermissions,
    isTaxi: discordRoles.taxiRolePermissions,
    isAdmin: discordRoles.adminRolePermissions,
  };

  const userTruthyArr = [
    ["isLeo", isLeo],
    ["isSupervisor", isSupervisor],
    ["isEmsFd", isEmsFd],
    ["isDispatch", isDispatch],
    ["isTow", isTow],
    ["isTaxi", isTaxi],
    ["isSupervisor", isSupervisor],
    ["isAdmin", isAdmin],
  ] as const;

  const permissionsToGive = [];
  for (const [name, isTruthy] of userTruthyArr) {
    const perms = permissions[name];

    if (typeof isTruthy === "undefined") {
      // skip the permissions since the Discord role hasn't been set
      // in the CAD settings
      continue;
    }

    if (isTruthy) {
      perms.length && permissionsToGive.push(...perms);
    } else {
      user.permissions = user.permissions.filter((v) => !perms.includes(v));
    }
  }

  const mergedPermissions = merge(user.permissions, permissionsToGive);

  const updateData = {
    permissions: user.rank === Rank.OWNER ? [] : mergedPermissions,
    isLeo: discordRoles.leoRoles.length <= 0 ? undefined : isLeo,
    isEmsFd: discordRoles.emsFdRoles.length <= 0 ? undefined : isEmsFd,
    isSupervisor: discordRoles.leoSupervisorRoles.length <= 0 ? undefined : isSupervisor,
    isDispatch: discordRoles.dispatchRoles.length <= 0 ? undefined : isDispatch,
    isTow: discordRoles.towRoles.length <= 0 ? undefined : isTow,
    isTaxi: discordRoles.taxiRoles.length <= 0 ? undefined : isTaxi,
    rank:
      user.rank !== Rank.OWNER
        ? hasRole(discordRoles.adminRoleId, discordMember.roles)
          ? Rank.ADMIN
          : Rank.USER
        : undefined,
    whitelistStatus: makeWhitelistStatus(
      cad?.whitelisted ?? false,
      hasRole(discordRoles.whitelistedRoleId, discordMember.roles),
    ),
  };

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: updateData,
  });

  return updatedUser;
}

function hasRoleArr(roles: DiscordRole[], roleIds: string[]) {
  if (roles.length <= 0) return undefined;
  return roles.some((role) => roleIds.includes(role.id));
}

function hasRole(roleId: string | null, roleIds: string[]) {
  if (!roleId) return undefined;
  return roleIds.includes(roleId);
}

function makeWhitelistStatus(cadWhitelisted: boolean, hasRole: boolean | undefined) {
  if (!cadWhitelisted) {
    return undefined;
  }

  if (typeof hasRole === "undefined") {
    return undefined;
  }

  return hasRole ? WhitelistStatus.ACCEPTED : WhitelistStatus.PENDING;
}
