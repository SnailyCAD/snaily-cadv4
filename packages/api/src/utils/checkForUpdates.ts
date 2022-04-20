import { getCADVersion } from "@snailycad/utils/version";
import { request } from "undici";
import { underline, bold, green } from "colorette";

async function fetchLatestVersion(): Promise<string | null> {
  try {
    const { body } = await request(
      "https://raw.githubusercontent.com/SnailyCAD/snaily-cadv4/main/package.json",
      {
        headers: {
          "cache-control": "no-cache",
          accept: "application/json",
        },
      },
    );

    const json = await body.json().catch(() => null);
    return json?.version ?? null;
  } catch (error) {
    console.log(error);
    return null;
  }
}

export async function checkForUpdates() {
  const currentVersion = await getCADVersion();
  const latestVersion = await fetchLatestVersion();

  if (currentVersion && latestVersion) {
    if (currentVersion !== latestVersion) {
      const message = `
${green(bold("Update available!"))} ${underline(currentVersion)} -> ${underline(latestVersion)}.
Documentation: https://cad-docs.caspertheghost.me/docs/installations/updating
      `;

      console.log(message);
    }
  }
}
