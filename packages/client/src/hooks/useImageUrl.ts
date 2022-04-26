import { findUrl } from "lib/fetch";
import { IMGUR_REGEX } from "@snailycad/config";
import { useMounted } from "@casper124578/useful";

type ImageURLTypes = "citizens" | "users" | "bleeter" | "units" | "cad" | "values";

export function useImageUrl() {
  const mounted = useMounted();

  function makeImageUrl(type: ImageURLTypes, id: string | null) {
    if (!mounted || !id) return;

    if (id.match(IMGUR_REGEX)) {
      return id;
    }

    const url = findUrl().replace("/v1", "");
    const IMAGE_URL = `${url}/static/`;

    return `${IMAGE_URL}${type}/${id}`;
  }

  return { makeImageUrl };
}
