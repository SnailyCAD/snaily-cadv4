import * as React from "react";
import { PlayerMarker } from "./player-marker";
import { useMapPlayers } from "hooks/realtime/use-map-players";
import { useDispatchMapState } from "state/mapState";

export function RenderMapPlayers() {
  const { openUnits, setOpenUnits } = useDispatchMapState((state) => ({
    openUnits: state.openUnits,
    setOpenUnits: state.setOpenUnits,
  }));
  const { players } = useMapPlayers();

  function handleToggle(name: string) {
    const newOpenUnits = openUnits.includes(name)
      ? openUnits.filter((v) => v !== name)
      : [...openUnits, name];
    setOpenUnits(newOpenUnits);
  }

  const playerValues = React.useMemo(() => [...players.values()], [players]);

  return playerValues.map((player, idx) => (
    <PlayerMarker handleToggle={handleToggle} key={`${player.identifier}-${idx}`} player={player} />
  ));
}
