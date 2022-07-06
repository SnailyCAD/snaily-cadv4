import { hasPermission } from "@snailycad/permissions";
import { DiscordRole, Rank, User, WhitelistStatus } from "@snailycad/types";
import { APIGuildMember, RESTGetAPIGuildMemberResult, Routes } from "discord-api-types/v10";
import { BOT_TOKEN, getRest, GUILD_ID } from "lib/discord/config";
import { prisma } from "lib/prisma";
import { manyToManyHelper } from "utils/manyToMany";

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
  | "whitelistStatus"
  | "roles";

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
      courthouseRoles: true,
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
    hasPermission({
      fallback: user.isLeo,
      userToCheck: user,
      permissionsToCheck: discordRoles.leoRolePermissions,
    }),
  );
  const leoSupervisorRoles = makeRolesArr(
    discordRoles.leoSupervisorRoles,
    hasPermission({
      fallback: user.isSupervisor,
      userToCheck: user,
      permissionsToCheck: discordRoles.leoSupervisorRolePermissions,
    }),
  );
  const emsFdRoles = makeRolesArr(
    discordRoles.emsFdRoles,
    hasPermission({
      fallback: user.isEmsFd,
      userToCheck: user,
      permissionsToCheck: discordRoles.emsFdRolePermissions,
    }),
  );
  const dispatchRoles = makeRolesArr(
    discordRoles.dispatchRoles,
    hasPermission({
      fallback: user.isDispatch,
      userToCheck: user,
      permissionsToCheck: discordRoles.dispatchRolePermissions,
    }),
  );
  const towRoles = makeRolesArr(
    discordRoles.towRoles,
    hasPermission({
      fallback: user.isTow,
      userToCheck: user,
      permissionsToCheck: discordRoles.towRolePermissions,
    }),
  );
  const taxiRoles = makeRolesArr(
    discordRoles.taxiRoles,
    hasPermission({
      fallback: user.isTaxi,
      userToCheck: user,
      permissionsToCheck: discordRoles.taxiRolePermissions,
    }),
  );
  const courthouseRoles = makeRolesArr(
    discordRoles.courthouseRoles,
    hasPermission({
      fallback: user.isTaxi,
      userToCheck: user,
      permissionsToCheck: discordRoles.courthouseRolePermissions,
    }),
  );
  const customRoles = makeCustomRolesArr(discordMember, user);

  console.log({ customRoles });

  const data = [
    ...leoRoles,
    ...emsFdRoles,
    ...leoSupervisorRoles,
    ...dispatchRoles,
    ...towRoles,
    ...taxiRoles,
    ...courthouseRoles,
    ...customRoles,
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

function makeCustomRolesArr(discordMember: APIGuildMember, user: Pick<User, UserProperties>) {
  const disconnectConnectArray = manyToManyHelper(
    discordMember.roles,
    user.roles?.map((v) => v.discordRoleId!) ?? [],
    { showExisting: true },
  );

  const roles: { roleId: string; method: "put" | "delete" }[] = [];
  for (const value of disconnectConnectArray) {
    const isDisconnect = "disconnect" in value;
    const isConnect = "connect" in value;
    const isExisting = "existing" in value;

    const id = (
      isConnect
        ? value.connect
        : isDisconnect
        ? value.disconnect
        : isExisting
        ? value.existing
        : null
    )?.id;
    if (!id) continue;

    roles.push({ roleId: id, method: isConnect || isExisting ? "put" : "delete" });
  }

  return roles;
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
  const response = await rest[method](Routes.guildMemberRole(GUILD_ID!, discordId, roleId));
  .then(() => true)
  .catch(() => false);

  return response;
}

function createMethod(truthy: boolean): "put" | "delete" {
  return truthy ? "put" : "delete";
}
