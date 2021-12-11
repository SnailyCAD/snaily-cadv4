import { handleRequest } from "lib/fetch";
import type { IncomingMessage } from "http";
import { User } from "types/prisma";

export async function getSessionUser(req?: IncomingMessage): Promise<User | null> {
  try {
    const { data } = await handleRequest<User | null>("/user", { req, method: "POST" });

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
