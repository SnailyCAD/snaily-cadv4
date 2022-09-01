import { handleRequest } from "lib/fetch";
import type { IncomingMessage } from "node:http";
import type { GetUserData, PostUserLogoutData } from "@snailycad/types/api";

export async function getSessionUser(req?: IncomingMessage): Promise<GetUserData | null> {
  try {
    const response = await handleRequest<GetUserData | null>("/user", {
      req,
      method: "POST",
    });

    if (response.data) {
      return response.data ?? null;
    }

    return null;
  } catch {
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
