import * as React from "react";
import { useDispatchMapState, useSocketStore } from "state/mapState";
import type { SmartSignMarker } from "types/map";

export function useSmartSigns() {
  const socket = useSocketStore((state) => state.socket);
  const { smartSigns, setSmartSigns } = useDispatchMapState((state) => ({
    smartSigns: state.smartSigns,
    setSmartSigns: state.setSmartSigns,
  }));

  const onInitialize = React.useCallback((data: { smartSigns: SmartSignMarker[] }) => {
    setSmartSigns(data.smartSigns);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    const s = socket;

    if (s) {
      s.on("sna-live-map:smart-signs", onInitialize);
    }

    return () => {
      s?.off("sna-live-map:smart-signs", onInitialize);
    };
  }, [socket, onInitialize]);

  return smartSigns;
}
