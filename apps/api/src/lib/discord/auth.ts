import { type DiscordRole, Rank, type User, WhitelistStatus } from "@snailycad/types";
import {
  type APIGuildMember,
  Routes,
  type RESTGetAPIGuildMemberResult,
} from "discord-api-types/v10";
import { GUILD_ID } from "lib/discord/config";
import { prisma } from "lib/data/prisma";
import { manyToManyHelper } from "lib/data/many-to-many";
import { performDiscordRequest } from "./performDiscordRequest";
import { parseDiscordGuildIds } from "./utils";

async function findDiscordMember(discordId: string | null) {
  if (!GUILD_ID) return null;

  const guildIds = parseDiscordGuildIds(GUILD_ID);
  const memberRoles: string[] = [];
  let _member = null;

  for (const guildId of guildIds) {
    try {
      const member = await performDiscordRequest<RESTGetAPIGuildMemberResult>({
        async handler(rest) {
          if (!discordId) return null;
          return rest.get(Routes.guildMember(guildId, discordId));
        },
      });

      if (member) {
        memberRoles.push(...member.roles);
        _member = member;
      }
    } catch {
      continue;
    }
  }

  return { ..._member, roles: memberRoles };
}

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
        adminRoles: true,
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

    const discordMember = await findDiscordMember(user.discordId);
    // if the user is pending, we don't want to update their roles.
    if (!discordMember?.user?.id || discordMember.pending) return;

    const memberObj = {
      roles: discordMember.roles,
    };

    const isLeo = doesDiscordMemberHaveCADRole(discordRoles.leoRoles, memberObj);
    const isEmsFd = doesDiscordMemberHaveCADRole(discordRoles.emsFdRoles, memberObj);
    const isDispatch = doesDiscordMemberHaveCADRole(discordRoles.dispatchRoles, memberObj);
    const isTow = doesDiscordMemberHaveCADRole(discordRoles.towRoles, memberObj);
    const isTaxi = doesDiscordMemberHaveCADRole(discordRoles.taxiRoles, memberObj);
    const isSupervisor = doesDiscordMemberHaveCADRole(discordRoles.leoSupervisorRoles, memberObj);
    const isCourthouse = doesDiscordMemberHaveCADRole(discordRoles.courthouseRoles, memberObj);
    const isAdmin = doesDiscordMemberHaveCADRole(discordRoles.adminRoles, memberObj);
    const hasWhitelistAccess = doesDiscordMemberHaveCADRole(
      discordRoles.whitelistedRoleId,
      memberObj,
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
      { showUpsert: false },
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
          ? doesDiscordMemberHaveCADRole(discordRoles.adminRoles, { roles: discordMember.roles })
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

/**
 * check if the provided Discord Member has the provided CAD Roles.
 *
 * @returns `undefined` if the CAD doesn't have any roles specified,
 * otherwise `true` if the member has any of the roles specified,
 * otherwise `false`.
 */
function doesDiscordMemberHaveCADRole(
  cadRolesOrRoleId: DiscordRole[] | string | null,
  member: { roles: string[] },
) {
  // if the CAD doesn't have any roles specified,
  // return `undefined` to not update the CAD user's permissions.
  if (!cadRolesOrRoleId) return undefined;

  if (Array.isArray(cadRolesOrRoleId)) {
    // if the CAD doesn't have any roles specified,
    // return `undefined` to not update the CAD user's permissions.
    if (cadRolesOrRoleId.length <= 0) return undefined;
    return cadRolesOrRoleId.some((role) => member.roles.includes(role.id));
  }

  return member.roles.includes(cadRolesOrRoleId);
}

function makeWhitelistStatus(cadWhitelisted: boolean, hasRole: boolean | undefined) {
  if (!cadWhitelisted || typeof hasRole === "undefined") {
    return undefined;
  }

  return hasRole ? WhitelistStatus.ACCEPTED : WhitelistStatus.PENDING;
}

async function getCustomRoleDiscordRolesByDiscordMember(
  discordMember: Pick<APIGuildMember, "roles">,
) {
  const orClause = discordMember.roles.map((id) => ({ discordRoleId: id }));

  const customRoles = await prisma.customRole.findMany({
    where: { OR: orClause },
  });

  return customRoles;
}
