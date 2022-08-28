import { WhitelistStatus } from "@prisma/client";
import { allPermissions } from "@snailycad/permissions";
import type { Req, Res } from "@tsed/common";
import { BadRequest, Unauthorized } from "@tsed/exceptions";
import { getSessionUser } from "lib/auth/getSessionUser";
import { prisma } from "lib/prisma";
import { isRouteDisabled } from "./utils";

interface GetUserFromCADAPITokenOptions {
  req: Req;
  res: Res;
  apiTokenHeader: string | string[];
}

export async function getUserFromCADAPIToken(options: GetUserFromCADAPITokenOptions) {
  const cad = await prisma.cad.findFirst({
    select: {
      apiToken: true,
    },
  });

  if (!cad?.apiToken?.enabled || cad.apiToken.token !== options.apiTokenHeader) {
    throw new Unauthorized("Unauthorized");
  }

  const isDisabled = isRouteDisabled(options);
  if (isDisabled) {
    throw new BadRequest("routeIsDisabled");
  }

  const fakeUser = {
    isDispatch: true,
    isLeo: true,
    isEmsFd: true,
    rank: "API_TOKEN",
    isTow: true,
    isTaxi: true,
    isSupervisor: true,
    username: "Dispatch",
    whitelistStatus: WhitelistStatus.ACCEPTED,
    permissions: allPermissions,
  };

  return fakeUser;
}

export async function getUserFromSession(
  options: Omit<GetUserFromCADAPITokenOptions, "apiTokenHeader">,
) {
  const user = await getSessionUser({
    req: options.req,
    res: options.res,
    returnNullOnError: false,
  });

  const user2FA = await prisma.user2FA.findFirst({
    where: { userId: user.id },
  });

  if (user2FA) {
    user.twoFactorEnabled = true;
  }

  return user;
}
