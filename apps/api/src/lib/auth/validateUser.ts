import { Rank, WhitelistStatus, User } from "@snailycad/types";
import type { GetUserData } from "@snailycad/types/api";
import type { Req } from "@tsed/common";
import { NotFound, Unauthorized } from "@tsed/exceptions";
import { GetSessionUserErrors } from "./getSessionUser";

export function validateUserData(
  user: User | null,
  req: Req,
  returnNullOnError?: false,
): asserts user is GetUserData;
export function validateUserData(user: User | null, req: Req, returnNullOnError?: boolean) {
  if (!user) {
    if (returnNullOnError) return null;
    throw new Unauthorized(GetSessionUserErrors.NotFound);
  }

  if (user.rank !== Rank.OWNER) {
    if (user.banned) {
      if (returnNullOnError) return null;
      throw new NotFound(GetSessionUserErrors.UserBanned);
    }

    // if the user is still awaiting access, return the user but with a whitelistStatus of pending
    // this is so we can show the user a message saying they are awaiting access
    const isUserURL = req.url === "/v1/user" && req.method === "POST";
    if (!isUserURL && user.whitelistStatus === WhitelistStatus.PENDING) {
      if (returnNullOnError) return null;
      throw new NotFound(GetSessionUserErrors.WhitelistPending);
    }

    if (user.whitelistStatus === WhitelistStatus.DECLINED) {
      if (returnNullOnError) return null;
      throw new NotFound(GetSessionUserErrors.WhitelistDeclined);
    }
  }

  return user;
}
