import { resolve } from "node:path";
import { readdir } from "node:fs/promises";

export type Sounds = (typeof SOUND_NAMES)[number];
export const SOUND_NAMES = [
  "panic-button",
  "signal100",
  "added-to-call",
  "stop-roleplay",
  "status-update",
  "incoming-call",
] as const;

export async function getAvailableSounds(): Promise<Record<Sounds, boolean>> {
  const dir = resolve(process.cwd(), "public", "sounds");
  const availableSounds: Record<Sounds, boolean> = {
    "added-to-call": false,
    "incoming-call": false,
    "panic-button": false,
    signal100: false,
    "status-update": false,
    "stop-roleplay": false,
  };

  const files = await readdir(dir, { encoding: "utf-8" });
  for (const file of files) {
    const name = file.replace(".mp3", "") as Sounds;
    availableSounds[name] = true;
  }

  return availableSounds;
}
