import type { REST } from "@discordjs/rest";
import { getRest } from "./config";

interface Options {
  onError?(error: unknown): void;
  handler(rest: REST): Promise<unknown>;
}

export async function performDiscordRequest<T>(options: Options): Promise<T | null> {
  try {
    const rest = getRest();
    return (await options.handler(rest)) as T | null;
  } catch (error) {
    options.onError?.(error);
    return null;
  }
}
