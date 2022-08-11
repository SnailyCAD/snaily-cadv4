import process from "node:process";
import type { Buffer } from "node:buffer";
import { IMGUR_REGEX } from "@snailycad/config";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";
import sharp from "sharp";
import { randomUUID } from "node:crypto";

export function validateImgurURL(image: unknown) {
  if (image === null) return null;
  if (!image) return undefined;

  if (typeof image === "string" && image.includes("fakepath")) {
    return undefined;
  }

  if (typeof image !== "string") {
    throw new ExtendedBadRequest({ image: "invalidImageURL" });
  }

  if (!image.match(IMGUR_REGEX)) {
    throw new ExtendedBadRequest({ image: "invalidImageURL" });
  }

  return image;
}

interface RawImageToWebPOptions {
  buffer: Buffer;
  id?: string;
  pathType: "cad" | "citizens" | "users" | "bleeter" | "units" | "values";
}

export async function getImageWebPPath(options: RawImageToWebPOptions) {
  const sharpImage = sharp(options.buffer).webp({ quality: 80 });
  const imageBuffer = await sharpImage.toBuffer();

  const id = options.id ?? randomUUID();
  const fileName = `${id}.webp`;
  const path = `${process.cwd()}/public/${options.pathType}/${fileName}`;

  return { imageBuffer, fileName, path };
}
