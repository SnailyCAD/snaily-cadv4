import { DiscordRole, Rank, User, WhitelistStatus } from "@prisma/client";
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

  const discordMember = (await rest.get(
    Routes.guildMember(GUILD_ID, user.discordId),
  )) as RESTGetAPIGuildMemberResult | null;

  if (!discordMember?.user?.id || discordMember.pending) return;

  const leoRoles = makeRolesArr(discordRoles.leoRoles, user.isLeo);
  const leoSupervisorRoles = makeRolesArr(discordRoles.leoSupervisorRoles, user.isSupervisor);
  const emsFdRoles = makeRolesArr(discordRoles.emsFdRoles, user.isEmsFd);
  const dispatchRoles = makeRolesArr(discordRoles.dispatchRoles, user.isDispatch);
  const towRoles = makeRolesArr(discordRoles.towRoles, user.isTow);
  const taxiRoles = makeRolesArr(discordRoles.taxiRoles, user.isTaxi);

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
