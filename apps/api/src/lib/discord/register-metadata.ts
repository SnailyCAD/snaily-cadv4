/**
 * register the metadata to be stored by Discord. This should be a one time action.
 * Note: uses a Bot token for authentication, not a user token.
 */

import {
  ApplicationRoleConnectionMetadataType,
  RESTPutAPIApplicationRoleConnectionMetadataJSONBody,
  RESTPutAPIApplicationRoleConnectionMetadataResult,
  Routes,
} from "discord-api-types/v10";
import { performDiscordRequest } from "lib/discord/performDiscordRequest";

const DISCORD_CLIENT_ID = process.env["DISCORD_CLIENT_ID"];
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

export async function registerDiscordRolesMetadata() {
  try {
    if (!DISCORD_CLIENT_ID || !BOT_TOKEN) return;

    const body: RESTPutAPIApplicationRoleConnectionMetadataJSONBody = [
      {
        key: "cad_connected",
        name: process.env.DISCORD_METADATA_CAD_CONNECTED_NAME || "SnailyCAD Connected",
        description: "Whether the user has connected their SnailyCAD account to Discord.",
        type: ApplicationRoleConnectionMetadataType.BooleanEqual,
      },
    ];

    const response = (await performDiscordRequest({
      handler: (rest) =>
        rest.put(Routes.applicationRoleConnectionMetadata(DISCORD_CLIENT_ID), {
          body,
        }),
    })) as RESTPutAPIApplicationRoleConnectionMetadataResult;

    console.log({ response });
  } catch {
    // throw new Error("Error pushing discord metadata schema");
  }
}
