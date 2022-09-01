import { Rank, WhitelistStatus, User } from "@snailycad/types";
import type { GetUserData } from "@snailycad/types/api";
import { NotFound, Unauthorized } from "@tsed/exceptions";
import { GetSessionUserErrors } from "./getSessionUser";

export function validateUserData(
  user: User | null,
  returnNullOnError?: false,
): asserts user is GetUserData;
export function validateUserData(user: User | null, returnNullOnError?: boolean) {
  if (!user) {
    if (returnNullOnError) return null;
    throw new Unauthorized(GetSessionUserErrors.NotFound);
  }

  if (user.rank !== Rank.OWNER) {
    if (user.banned) {
      if (returnNullOnError) return null;
      throw new NotFound(GetSessionUserErrors.UserBanned);
    }

    if (user.whitelistStatus === WhitelistStatus.PENDING) {
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
