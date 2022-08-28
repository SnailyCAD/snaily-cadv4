import process from "node:process";
import { $log } from "@tsed/logger";
import { sign, verify } from "jsonwebtoken";

export function signJWT(value: any, expiresInSeconds: number | string) {
  const secret = process.env.JWT_SECRET ?? "NONE";

  if (secret === "NONE") {
    $log.warn("No JWT_SECRET env var was found");
  }

  return sign(value, secret, { expiresIn: expiresInSeconds });
}

export function verifyJWT(value: string) {
  const secret = process.env.JWT_SECRET ?? "NONE";

  if (secret === "NONE") {
    $log.warn("No JWT_SECRET env var was found");
  }

  try {
    return verify(value, secret) as { userId: string; sessionId: string; exp: number; iat: number };
  } catch {
    return null;
  }
}
