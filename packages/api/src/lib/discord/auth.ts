import { Rank, User } from "@prisma/client";
import { Routes, type RESTGetAPIGuildMemberResult } from "discord-api-types/v10";
import { getRest, GUILD_ID } from "lib/discord";
import { prisma } from "lib/prisma";

/**
 * fetch the roles from the wanting to authenticate user and append the respective permissions to the user
 */
export async function updateMemberRolesLogin(
  user: Pick<User, "id" | "rank" | "discordId">,
  discordRolesId: string | null,
) {
  if (!GUILD_ID || !discordRolesId || !user.discordId) return;

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

  const updateData = {
    isLeo: hasRole(discordRoles.leoRoleId, discordMember.roles),
    isSupervisor: hasRole(discordRoles.leoSupervisorRoleId, discordMember.roles),
    isDispatch: hasRole(discordRoles.dispatchRoleId, discordMember.roles),
    isEmsFd: hasRole(discordRoles.emsFdRoleId, discordMember.roles),
    isTow: hasRole(discordRoles.towRoleId, discordMember.roles),
    rank:
      user.rank !== Rank.OWNER
        ? hasRole(discordRoles.adminRoleId, discordMember.roles)
          ? Rank.ADMIN
          : Rank.USER
        : undefined,
  };

  await prisma.user.update({
    where: { id: user.id },
    data: updateData,
  });
}

function hasRole(roleId: string | null, roleIds: string[]) {
  if (!roleId) return undefined;

  return roleIds.some((v) => v === roleId);
}
