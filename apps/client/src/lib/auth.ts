import { handleRequest } from "lib/fetch";
import type { IncomingMessage } from "node:http";
import type { GetUserData, PostUserLogoutData } from "@snailycad/types/api";
import { WhitelistStatus } from "@snailycad/types";

export async function getSessionUser(req?: IncomingMessage): Promise<GetUserData | null> {
  try {
    const response = await handleRequest<GetUserData>("/user", {
      req,
      method: "POST",
    });

    if (response.data) {
      return response.data ?? null;
    }

    // @ts-expect-error `response` only exists on the object if an error occurred.
    if (response.response?.data?.message === "whitelistPending") {
      return { whitelistStatus: WhitelistStatus.PENDING } as GetUserData;
    }

    return null;
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error({ fetchError: e });
    }

    return null;
  }
}

export async function logout() {
  try {
    await handleRequest<PostUserLogoutData>("/user/logout", { method: "POST" });

    return true;
  } catch {
    return false;
  }
}
