import { DiscordRole, Rank, User, WhitelistStatus } from "@snailycad/types";
import { APIGuildMember, Routes, type RESTGetAPIGuildMemberResult } from "discord-api-types/v10";
import { getRest, GUILD_ID } from "lib/discord/config";
import { prisma } from "lib/prisma";
import { manyToManyHelper } from "utils/manyToMany";

/**
 * fetch the roles from the wanting to authenticate user and append the respective permissions to the user
 */
export async function updateMemberRolesLogin(
  user: Pick<User, "id" | "rank" | "discordId" | "whitelistStatus" | "permissions" | "roles">,
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
      courthouseRoles: true,
    },
  });

  if (!discordRoles) return;
  const rest = getRest();

  const cad = await prisma.cad.findFirst();

  const discordMember = (await rest
    .get(Routes.guildMember(GUILD_ID, user.discordId))
    .catch(() => null)) as RESTGetAPIGuildMemberResult | null;

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
  const isCourthouse = doesDiscordMemberHaveRole(discordRoles.courthouseRoles, discordMember.roles);
  const isAdmin = doesDiscordMemberHaveRole(discordRoles.adminRoleId, discordMember.roles);

  const permissions = {
    isLeo: discordRoles.leoRolePermissions,
    isSupervisor: discordRoles.leoSupervisorRolePermissions,
    isEmsFd: discordRoles.emsFdRolePermissions,
    isDispatch: discordRoles.dispatchRolePermissions,
    isTow: discordRoles.towRolePermissions,
    isTaxi: discordRoles.taxiRolePermissions,
    isCourthouse: discordRoles.courthouseRolePermissions,
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
    ["isCourthouse", isCourthouse],
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
    rank:
      user.rank !== Rank.OWNER
        ? doesDiscordMemberHaveRole(discordRoles.adminRoleId, discordMember.roles)
          ? Rank.ADMIN
          : Rank.USER
        : undefined,
    whitelistStatus: makeWhitelistStatus(
      cad?.whitelisted ?? false,
      doesDiscordMemberHaveRole(discordRoles.whitelistedRoleId, discordMember.roles),
    ),
  };

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: updateData,
  });

  return updatedUser;
}

function doesDiscordMemberHaveRole(roles: DiscordRole[] | string | null, roleIds: string[]) {
  if (Array.isArray(roles)) {
    if (roles.length <= 0) return undefined;
    return roles.some((role) => roleIds.includes(role.id));
  }

  if (!roles) return undefined;
  return roleIds.includes(roles);
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

async function getCustomRoleDiscordRolesByDiscordMember(discordMember: APIGuildMember) {
  const orClause = discordMember.roles.map((id) => ({ discordRoleId: id }));

  const customRoles = await prisma.customRole.findMany({
    where: { OR: orClause },
  });

  return customRoles;
}
