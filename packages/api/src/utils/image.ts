import { BadRequest } from "@tsed/exceptions";
import { IMGUR_REGEX } from "@snailycad/config";

export function validateImgurURL(image: unknown) {
  if (!image) return undefined;

  if (typeof image !== "string") {
    throw new BadRequest("invalidImageURL");
  }

  if (!image.match(IMGUR_REGEX)) {
    throw new BadRequest("invalidImageURL");
  }

  return image;
}
