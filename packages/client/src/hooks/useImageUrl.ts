import * as React from "react";
import { findUrl } from "lib/fetch";

export function useImageUrl() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  function makeImageUrl(type: "citizens" | "users" | "bleeter" | "units", id: string) {
    if (!mounted) return;

    const url = findUrl().replace("/v1", "");
    const IMAGE_URL = `${url}/static/`;

    return `${IMAGE_URL}${type}/${id}`;
  }

  return { makeImageUrl };
}
