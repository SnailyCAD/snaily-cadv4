import type { REST } from "@discordjs/rest";
import { getRest } from "./config";

interface Options<T> {
  onError?(error: unknown): void;
  handler(rest: REST): Promise<T>;
}

export async function performDiscordRequest<T>(options: Options<T>): Promise<T | null> {
  try {
    const rest = getRest();
    return options.handler(rest);
  } catch (error) {
    options.onError?.(error);
    return null;
  }
}
