import * as React from "react";
import { findUrl } from "lib/fetch";
import { IMGUR_REGEX } from "@snailycad/config";

export function useImageUrl() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  function makeImageUrl(
    type: "citizens" | "users" | "bleeter" | "units" | "cad",
    id: string | null,
  ) {
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
