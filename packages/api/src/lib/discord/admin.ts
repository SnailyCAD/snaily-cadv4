import { hasPermission, Permissions } from "@snailycad/permissions";
import { DiscordRole, Rank, User, WhitelistStatus } from "@prisma/client";
import { RESTGetAPIGuildMemberResult, Routes } from "discord-api-types/v10";
import { BOT_TOKEN, getRest, GUILD_ID } from "lib/discord/config";
import { prisma } from "lib/prisma";

type UserProperties =
  | "permissions"
  | "isLeo"
  | "rank"
  | "isSupervisor"
  | "isEmsFd"
  | "isDispatch"
  | "isTow"
  | "isTaxi"
  | "discordId"
  | "whitelistStatus";

export async function updateMemberRoles(
  user: Pick<User, UserProperties>,
  discordRolesId: string | null,
) {
  if (!GUILD_ID || !BOT_TOKEN || !discordRolesId || !user.discordId) return;

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

  const discordMember = (await rest
    .get(Routes.guildMember(GUILD_ID, user.discordId))
    .catch(() => null)) as RESTGetAPIGuildMemberResult | null;

  if (!discordMember?.user?.id || discordMember.pending) return;

  const leoRoles = makeRolesArr(
    discordRoles.leoRoles,
    hasPermissionWithFallback({
      fallback: user.isLeo,
      userPermissions: user.permissions,
      permissionsToCheck: discordRoles.leoRolePermissions,
    }),
  );
  const leoSupervisorRoles = makeRolesArr(
    discordRoles.leoSupervisorRoles,
    hasPermissionWithFallback({
      fallback: user.isSupervisor,
      userPermissions: user.permissions,
      permissionsToCheck: discordRoles.leoSupervisorRolePermissions,
    }),
  );
  const emsFdRoles = makeRolesArr(
    discordRoles.emsFdRoles,
    hasPermissionWithFallback({
      fallback: user.isEmsFd,
      userPermissions: user.permissions,
      permissionsToCheck: discordRoles.emsFdRolePermissions,
    }),
  );
  const dispatchRoles = makeRolesArr(
    discordRoles.dispatchRoles,
    hasPermissionWithFallback({
      fallback: user.isDispatch,
      userPermissions: user.permissions,
      permissionsToCheck: discordRoles.dispatchRolePermissions,
    }),
  );
  const towRoles = makeRolesArr(
    discordRoles.towRoles,
    hasPermissionWithFallback({
      fallback: user.isTow,
      userPermissions: user.permissions,
      permissionsToCheck: discordRoles.towRolePermissions,
    }),
  );
  const taxiRoles = makeRolesArr(
    discordRoles.taxiRoles,
    hasPermissionWithFallback({
      fallback: user.isTaxi,
      userPermissions: user.permissions,
      permissionsToCheck: discordRoles.taxiRolePermissions,
    }),
  );

  const data = [
    ...leoRoles,
    ...emsFdRoles,
    ...leoSupervisorRoles,
    ...dispatchRoles,
    ...towRoles,
    ...taxiRoles,
    { roleId: discordRoles.adminRoleId, method: createMethod(user.rank === Rank.ADMIN) },
    {
      roleId: discordRoles.whitelistedRoleId,
      method: createMethod(user.whitelistStatus === WhitelistStatus.ACCEPTED),
    },
  ];

  await Promise.all(
    data.map(async (d) => {
      await addOrRemoveRole(user.discordId!, d.roleId, d.method);
    }),
  );
}

function makeRolesArr(roles: DiscordRole[], isTrue: boolean) {
  return roles.map((role) => ({
    roleId: role.id,
    method: createMethod(isTrue),
  }));
}

async function addOrRemoveRole(discordId: string, roleId: string | null, method: "put" | "delete") {
  if (!roleId) return false;

  const rest = getRest();
  const response = await rest[method](Routes.guildMemberRole(GUILD_ID!, discordId, roleId))
    .then(() => true)
    .catch(() => false);

  return response;
}

function createMethod(truthy: boolean): "put" | "delete" {
  return truthy ? "put" : "delete";
}

function hasPermissionWithFallback(options: {
  userPermissions: string[];
  permissionsToCheck: readonly (Permissions | string)[];
  fallback: boolean;
}) {
  if (!options.userPermissions.length || !options.permissionsToCheck.length) {
    return options.fallback;
  }

  return hasPermission(options.userPermissions, options.permissionsToCheck as Permissions[]);
}
