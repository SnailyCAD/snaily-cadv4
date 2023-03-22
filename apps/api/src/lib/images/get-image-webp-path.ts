import type { Buffer } from "node:buffer";
import process from "node:process";
import sharp from "sharp";
import { randomUUID } from "node:crypto";

export interface RawImageToWebPOptions {
  buffer: Buffer;
  id?: string;
  pathType: "cad" | "citizens" | "users" | "bleeter" | "units" | "values";
}

export async function getImageWebPPath(options: RawImageToWebPOptions) {
  const sharpImage = sharp(options.buffer).webp();
  const buffer = await sharpImage.toBuffer();

  const id = options.id ?? randomUUID();
  const fileName = `${id}.webp`;
  const path = `${process.cwd()}/public/${options.pathType}/${fileName}`;

  return { buffer, fileName, path };
}
