import type { cad } from "@snailycad/types";
import { useAuth } from "context/AuthContext";
import { toastError } from "lib/error";
import * as React from "react";

export function ActiveMapUnits() {
  const { cad } = useAuth();
  const url = getCADURL(cad);

  const [socket, setSocket] = React.useState<WebSocket | null>(null);

  React.useEffect(() => {
    if (!socket && url) {
      setSocket(new WebSocket(url));
    }
  }, [url, socket]);

  return <div></div>;
}

function getCADURL(cad: cad | null) {
  if (!cad) return null;

  const liveMapURL = cad.miscCadSettings?.liveMapURL;

  if (!liveMapURL) {
    toastError({
      duration: Infinity,
      message: "There was no live_map_url provided from the CAD-Settings.",
    });
    return null;
  }

  if (!liveMapURL.startsWith("ws")) {
    toastError({
      duration: Infinity,
      message: "The live_map_url did not start with ws. Make sure it is a WebSocket protocol",
    });
    return null;
  }

  return liveMapURL;
}
