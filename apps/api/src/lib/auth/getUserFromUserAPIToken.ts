import type { User } from "@snailycad/types";
import { Forbidden } from "@tsed/exceptions";
import { prisma } from "lib/data/prisma";
import { GetSessionUserErrors, userProperties } from "./getSessionUser";

export async function getUserFromUserAPIToken(
  userApiTokenHeader: string,
  includePassword?: boolean,
) {
  const apiToken = await prisma.apiToken.findFirst({
    where: { token: userApiTokenHeader },
  });

  if (!apiToken) {
    throw new Forbidden(GetSessionUserErrors.InvalidAPIToken);
  }

  const user = await prisma.user.findFirst({
    where: { apiToken: { token: userApiTokenHeader } },
    select: { ...userProperties, password: includePassword },
  });

  if (!user) {
    return { apiToken: null, user: null };
  }

  return {
    apiToken,
    user: { ...user } as User & { password: string },
  };
}
