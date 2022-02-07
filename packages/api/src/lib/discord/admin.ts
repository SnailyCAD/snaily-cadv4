import type { User } from "@prisma/client";
import { RESTGetAPIGuildMemberResult, Routes } from "discord-api-types/v9";
import { BOT_TOKEN, getRest, GUILD_ID } from "lib/discord";
import { prisma } from "lib/prisma";

export async function updateMemberRoles(
  user: Pick<User, "isLeo" | "isSupervisor" | "isEmsFd" | "isDispatch" | "isTow" | "discordId">,
  discordRolesId: string | null,
  allowDelete = true,
) {
  if (!GUILD_ID || !BOT_TOKEN || !discordRolesId || !user.discordId) return;

  const discordRoles = await prisma.discordRoles.findUnique({
    where: { id: String(discordRolesId) },
    include: { roles: true },
  });

  if (!discordRoles) return;
  const rest = getRest();

  const discordMember = (await rest.get(
    Routes.guildMember(GUILD_ID, user.discordId),
  )) as RESTGetAPIGuildMemberResult | null;

  if (!discordMember?.user?.id || discordMember.pending) return;

  const data = [
    { roleId: discordRoles.leoRoleId, method: createMethod(user.isLeo) },
    { roleId: discordRoles.leoSupervisorRoleId, method: createMethod(user.isSupervisor) },
    { roleId: discordRoles.emsFdRoleId, method: createMethod(user.isEmsFd) },
    { roleId: discordRoles.dispatchRoleId, method: createMethod(user.isDispatch) },
    { roleId: discordRoles.towRoleId, method: createMethod(user.isTow) },
  ];

  await Promise.all(
    data.map(async (d) => {
      if (d.method === "delete" && !allowDelete) return;
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
