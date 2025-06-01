import * as React from "react";
import { useDispatchMapState, useSocketStore } from "state/mapState";
import type { SmartMotorwaySignMarker } from "types/map";

export function useSmartMotorwaySigns() {
  const socket = useSocketStore((state) => state.socket);
  const { smartMotorwaySigns, setSmartMotorwaySigns } = useDispatchMapState((state) => ({
    smartMotorwaySigns: state.smartMotorwaySigns,
    setSmartMotorwaySigns: state.setSmartMotorwaySigns,
  }));

  const onInitialize = React.useCallback(
    (data: { smartMotorwaySigns: SmartMotorwaySignMarker[] }) => {
      setSmartMotorwaySigns(data.smartMotorwaySigns);
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  React.useEffect(() => {
    const s = socket;

    if (s) {
      s.on("sna-live-map:smart-motorways-signs", onInitialize);
    }

    return () => {
      s?.off("sna-live-map:smart-motorways-signs", onInitialize);
    };
  }, [socket, onInitialize]);

  return smartMotorwaySigns;
}
