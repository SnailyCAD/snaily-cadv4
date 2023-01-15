import { IMAGES_REGEX } from "@snailycad/config";
import { ExtendedBadRequest } from "src/exceptions/extended-bad-request";

export function validateImageURL(image: unknown) {
  if (image === null) return null;
  if (!image) return undefined;

  if (typeof image === "string" && image.includes("fakepath")) {
    return undefined;
  }

  if (typeof image !== "string") {
    throw new ExtendedBadRequest({ image: "invalidImageURL" });
  }

  if (!image.match(IMAGES_REGEX)) {
    throw new ExtendedBadRequest({ image: "invalidImageURL" });
  }

  return image;
}
