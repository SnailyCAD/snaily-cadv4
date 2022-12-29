import * as React from "react";
import { ActiveMapUnits } from "./ActiveMapUnits";
import { PlayerMarker } from "./PlayerMarker";
import { useMapPlayers } from "hooks/realtime/use-map-players";

export function RenderMapPlayers() {
  const [openItems, setOpenItems] = React.useState<string[]>([]);

  const { players } = useMapPlayers();

  function handleToggle(playerId: string) {
    setOpenItems((p) => {
      if (p.includes(playerId)) {
        return p.filter((v) => v !== playerId);
      }

      return [...p, playerId];
    });
  }

  const playerValues = React.useMemo(() => {
    return [...players.values()];
  }, [players]);

  return (
    <>
      {[...players.values()].map((player) => (
        <PlayerMarker key={player.playerId} handleToggle={handleToggle} player={player} />
      ))}

      <ActiveMapUnits setOpenItems={setOpenItems} openItems={openItems} players={playerValues} />
    </>
  );
}
