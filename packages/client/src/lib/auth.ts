import { handleRequest } from "lib/fetch";
import { User } from "types/prisma";

export async function getSessionUser(headers?: any): Promise<User | null> {
  try {
    const { data } = await handleRequest<User | null>("/user", { headers, method: "POST" });

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
