import * as React from "react";
import { ActiveMapUnits } from "./ActiveMapUnits";
import { PlayerMarker } from "./PlayerMarker";
import { useMapPlayers } from "hooks/realtime/use-map-players";

export function RenderMapPlayers() {
  const [openItems, setOpenItems] = React.useState<string[]>([]);

  const { players } = useMapPlayers();

  function handleToggle(name: string) {
    setOpenItems((p) => {
      if (p.includes(name)) {
        return p.filter((v) => v !== name);
      }

      return [...p, name];
    });
  }

  const playerValues = React.useMemo(() => {
    return [...players.values()];
  }, [players]);

  return (
    <>
      {playerValues.map((player, idx) => (
        <PlayerMarker
          key={`${player.identifier}-${idx}`}
          handleToggle={handleToggle}
          player={player}
        />
      ))}

      <ActiveMapUnits setOpenItems={setOpenItems} openItems={openItems} players={playerValues} />
    </>
  );
}
