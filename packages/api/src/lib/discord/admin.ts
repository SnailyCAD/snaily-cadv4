import { Rank, User, WhitelistStatus } from "@prisma/client";
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
    include: { roles: true, leoRoles: true },
  });

  if (!discordRoles) return;
  const rest = getRest();

  const discordMember = (await rest.get(
    Routes.guildMember(GUILD_ID, user.discordId),
  )) as RESTGetAPIGuildMemberResult | null;

  if (!discordMember?.user?.id || discordMember.pending) return;

  const leoRoles = discordRoles.leoRoles.map((role) => ({
    roleId: role.id,
    method: createMethod(user.isLeo),
  }));

  const data = [
    ...leoRoles,
    { roleId: discordRoles.leoSupervisorRoleId, method: createMethod(user.isSupervisor) },
    { roleId: discordRoles.emsFdRoleId, method: createMethod(user.isEmsFd) },
    { roleId: discordRoles.dispatchRoleId, method: createMethod(user.isDispatch) },
    { roleId: discordRoles.towRoleId, method: createMethod(user.isTow) },
    { roleId: discordRoles.taxiRoleId, method: createMethod(user.isTaxi) },
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
