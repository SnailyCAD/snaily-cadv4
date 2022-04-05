import { DiscordRole, Rank, User, WhitelistStatus } from "@prisma/client";
import { defaultPermissions, hasPermission, Permissions } from "@snailycad/permissions";
import { RESTGetAPIGuildMemberResult, Routes } from "discord-api-types/v10";
import { BOT_TOKEN, getRest, GUILD_ID } from "lib/discord/config";
import { prisma } from "lib/prisma";

type UserProperties =
  | "isLeo"
  | "rank"
  | "isSupervisor"
  | "isEmsFd"
  | "isDispatch"
  | "isTow"
  | "isTaxi"
  | "discordId"
  | "whitelistStatus"
  | "permissions";

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

  const discordMember = (await rest.get(
    Routes.guildMember(GUILD_ID, user.discordId),
  )) as RESTGetAPIGuildMemberResult | null;

  if (!discordMember?.user?.id || discordMember.pending) return;

  const leoRoles = makeRolesArr(
    discordRoles.leoRoles,
    hasPermissionWithFallback({
      permissionsToCheck: defaultPermissions.defaultLeoPermissions,
      fallback: user.isLeo,
      userPermissions: user.permissions,
    }),
  );
  const leoSupervisorRoles = makeRolesArr(discordRoles.leoSupervisorRoles, user.isSupervisor);
  const emsFdRoles = makeRolesArr(
    discordRoles.emsFdRoles,
    hasPermissionWithFallback({
      permissionsToCheck: defaultPermissions.defaultEmsFdPermissions,
      fallback: user.isEmsFd,
      userPermissions: user.permissions,
    }),
  );
  const dispatchRoles = makeRolesArr(
    discordRoles.dispatchRoles,
    hasPermissionWithFallback({
      permissionsToCheck: defaultPermissions.defaultDispatchPermissions,
      fallback: user.isDispatch,
      userPermissions: user.permissions,
    }),
  );
  const towRoles = makeRolesArr(
    discordRoles.towRoles,
    hasPermissionWithFallback({
      permissionsToCheck: defaultPermissions.defaultTowPermissions,
      fallback: user.isTow,
      userPermissions: user.permissions,
    }),
  );
  const taxiRoles = makeRolesArr(
    discordRoles.taxiRoles,
    hasPermissionWithFallback({
      permissionsToCheck: defaultPermissions.defaultTaxiPermissions,
      fallback: user.isTaxi,
      userPermissions: user.permissions,
    }),
  );

  const data = [
    ...leoRoles,
    ...emsFdRoles,
    ...leoSupervisorRoles,
    ...dispatchRoles,
    ...towRoles,
    ...taxiRoles,
    {
      roleId: discordRoles.adminRoleId,
      method: createMethod(
        hasPermissionWithFallback({
          permissionsToCheck: defaultPermissions.allDefaultAdminPermissions,
          fallback: user.rank === Rank.ADMIN,
          userPermissions: user.permissions,
        }),
      ),
    },
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
  permissionsToCheck: Permissions[];
  fallback: boolean;
}) {
  if (!options.permissionsToCheck.length) return options.fallback;

  return hasPermission(options.userPermissions, options.permissionsToCheck);
}
