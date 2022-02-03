import { handleRequest } from "lib/fetch";
import type { IncomingMessage } from "http";
import type { User } from "@snailycad/types";

export async function getSessionUser(req?: IncomingMessage, cookie?: string): Promise<User | null> {
  try {
    const { data } = await handleRequest<User | null>("/user", { req, method: "POST" }, cookie);

    if (data?.id) {
      return data;
    }

    return null;
  } catch {
    return null;
  }
}

export async function logout() {
  try {
    await handleRequest<User | null>("/user/logout", { method: "POST" });

    return true;
  } catch {
    return false;
  }
}
