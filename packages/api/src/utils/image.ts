import { IMGUR_REGEX } from "@snailycad/config";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";

export function validateImgurURL(image: unknown) {
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
