import process from "node:process";
import { REST } from "@discordjs/rest";

export const DISCORD_API_VERSION = "10" as const;
export const DISCORD_API_URL = `https://discord.com/api/v${DISCORD_API_VERSION}`;
export const GUILD_ID = process.env.DISCORD_SERVER_ID;
export const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

let cacheREST: REST;
export function getRest(): REST {
  if (!BOT_TOKEN || BOT_TOKEN === "undefined") {
    throw new Error("mustSetBotTokenGuildId");
  }

  cacheREST ??= new REST({ version: DISCORD_API_VERSION }).setToken(BOT_TOKEN);

  if (process.env.NODE_ENV === "development") {
    cacheREST.on("restDebug", console.info);
  }

  return cacheREST;
}
