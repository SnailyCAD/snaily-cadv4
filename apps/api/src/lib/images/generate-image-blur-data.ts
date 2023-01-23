import { request } from "undici";
import type { getImageWebPPath } from "./get-image-webp-path";

const cache = new Map<string, string>();

export default async function generateBlurPlaceholder(
  image: Awaited<ReturnType<typeof getImageWebPPath>> | string | null | undefined,
): Promise<string | null | undefined> {
  if (image === null) return null;
  if (!image) return undefined;

  const isImgurURL = typeof image === "string";

  if (isImgurURL) {
    let placeholderBlur = cache.get(image);
    if (placeholderBlur) {
      return placeholderBlur;
    }

    const base64 = await fetchImageURLData(image);
    if (!base64) {
      // return undefined to not update the image blur data
      return undefined;
    }

    placeholderBlur = `data:image/jpeg;base64,${base64}`;
    cache.set(image, placeholderBlur);

    return placeholderBlur;
  }

  let placeholderBlur = cache.get(image.fileName);
  if (placeholderBlur) {
    return placeholderBlur;
  }

  const base64 = Buffer.from(image.buffer).toString("base64");
  placeholderBlur = `data:image/jpeg;base64,${base64}`;
  cache.set(image.fileName, placeholderBlur);

  return placeholderBlur;
}

async function fetchImageURLData(image: string) {
  try {
    const response = await request(image);
    const buffer = await response.body.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    return base64;
  } catch (e) {
    console.error(e);
    return null;
  }
}
