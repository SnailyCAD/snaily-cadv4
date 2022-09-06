import * as React from "react";
import { ActiveMapUnits } from "./ActiveMapUnits";
import { PlayerMarker } from "./PlayerMarker";
import { useMapPlayers } from "hooks/realtime/useMapPlayers";
import { MapItem, useDispatchMapState } from "state/mapState";

export function RenderMapPlayers() {
  const [openItems, setOpenItems] = React.useState<string[]>([]);

  const { hiddenItems } = useDispatchMapState();
  const { players } = useMapPlayers();

  function handleToggle(playerId: string) {
    setOpenItems((p) => {
      if (p.includes(playerId)) {
        return p.filter((v) => v !== playerId);
      }

      return [...p, playerId];
    });
  }

  return (
    <>
      {!hiddenItems[MapItem.UNITS_ONLY] &&
        players.map((player) => (
          <PlayerMarker key={player.identifier} handleToggle={handleToggle} player={player} />
        ))}

      <ActiveMapUnits setOpenItems={setOpenItems} openItems={openItems} players={players} />
    </>
  );
}
