import { hasPermission, Permissions } from "@snailycad/permissions";
import type { User } from "@snailycad/types";
import { Forbidden } from "@tsed/exceptions";
import { prisma } from "lib/data/prisma";
import { GetSessionUserErrors, userProperties } from "./getSessionUser";

export async function getUserFromUserAPIToken(userApiTokenHeader: string) {
  const apiToken = await prisma.apiToken.findFirst({
    where: { token: userApiTokenHeader },
  });

  if (!apiToken) {
    throw new Forbidden(GetSessionUserErrors.InvalidAPIToken);
  }

  const user: User | null = await prisma.user.findFirst({
    where: { apiToken: { token: userApiTokenHeader } },
    select: userProperties,
  });

  if (user) {
    const hasPersonalApiTokenPerms = hasPermission({
      userToCheck: user,
      permissionsToCheck: [Permissions.UsePersonalApiToken],
    });

    if (!hasPersonalApiTokenPerms) {
      throw new Forbidden(GetSessionUserErrors.InvalidPermissionsForUserAPIToken);
    }
  }

  return { apiToken, user };
}
