/**
 * register the metadata to be stored by Discord. This should be a one time action.
 * Note: uses a Bot token for authentication, not a user token.
 */

import { request } from "undici";

const DISCORD_CLIENT_ID = process.env["DISCORD_CLIENT_ID"];
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

export async function registerDiscordRolesMetadata() {
  if (!DISCORD_CLIENT_ID || !BOT_TOKEN) return;

  const url = `https://discord.com/api/v10/applications/${DISCORD_CLIENT_ID}/role-connections/metadata`;
  // supported types: number_lt=1, number_gt=2, number_eq=3 number_neq=4, datetime_lt=5, datetime_gt=6, boolean_eq=7, boolean_neq=8
  const body = [
    {
      key: "cad_connected",
      name: "SnailyCAD Connected",
      description: "Whether the user has connected their SnailyCAD account to Discord.",
      type: 7,
    },
  ];

  const response = await request(url, {
    method: "PUT",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bot ${BOT_TOKEN}`,
    },
  });
  if (response.statusCode === 200) {
    const data = await response.body.json();
    console.log(data);
  } else {
    // throw new Error(`Error pushing discord metadata schema: [${response.status}] ${response.statusText}`);
    const data = await response.body.text();
    console.log(data);
  }
}
