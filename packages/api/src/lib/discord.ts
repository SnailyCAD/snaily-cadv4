import process from "process";
import { REST } from "@discordjs/rest";

export const DISCORD_API_VERSION = "v10";
export const DISCORD_API_URL = `https://discord.com/api/${DISCORD_API_VERSION}`;
export const GUILD_ID = process.env.DISCORD_SERVER_ID;
export const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

let cacheREST: REST;
export function getRest(): REST {
  if (!BOT_TOKEN) {
    throw new Error("mustSetBotTokenGuildId");
  }

  cacheREST ??= new REST({ version: "10" }).setToken(BOT_TOKEN);

  if (process.env.NODE_ENV === "development") {
    cacheREST.on("restDebug", console.log);
  }

  return cacheREST;
}
