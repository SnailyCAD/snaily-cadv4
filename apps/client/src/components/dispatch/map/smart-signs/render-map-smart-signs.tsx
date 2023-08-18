import * as React from "react";
import { useMapPlayers } from "hooks/realtime/use-map-players";
import { SmartSignsMarker } from "./smart-sign-marker";
import { useSmartSigns } from "./use-smart-signs";

export function RenderMapSmartSigns() {
  const [openItems, setOpenItems] = React.useState<string[]>([]);

  const { smartSigns } = useSmartSigns();

  function handleToggle(name: string) {
    setOpenItems((p) => {
      if (p.includes(name)) {
        return p.filter((v) => v !== name);
      }

      return [...p, name];
    });
  }

  return smartSigns.map((player, idx) => null);
}
