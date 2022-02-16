import type { cad } from "@snailycad/types";
import { useAuth } from "context/AuthContext";
import { toastError } from "lib/error";
import { convertToMap } from "lib/map/utils";
import * as React from "react";
import { Marker, Popup, useMap } from "react-leaflet";
import type { DataActions, PlayerDataEvent } from "types/Map";

export function RenderMapPlayers() {
  const [players, setPlayers] = React.useState<PlayerDataEvent["payload"]>([]);
  const [socket, setSocket] = React.useState<WebSocket | null>(null);

  const { cad } = useAuth();
  const url = getCADURL(cad);
  const map = useMap();

  const onPlayerData = React.useCallback((data: PlayerDataEvent) => {
    setPlayers(data.payload);
  }, []);

  React.useEffect(() => {
    if (!socket && url) {
      setSocket(new WebSocket(url));
    }
  }, [url, socket]);

  React.useEffect(() => {
    if (socket) {
      socket.addEventListener("message", (e) => {
        const data = JSON.parse(e.data) as DataActions;

        if (data.type === "playerData") {
          onPlayerData(data);
        }
      });
    }
  }, [socket, onPlayerData]);

  return (
    <>
      {players.map((player, idx) => {
        const pos = player.pos.x && player.pos.y && convertToMap(player.pos.x, player.pos.y, map);
        if (!pos) return null;

        return (
          <Marker key={idx} position={pos}>
            <Popup minWidth={500}>
              <p style={{ margin: 5 }}>
                <strong>Player:</strong> {player.name}
              </p>
              <div className="info-body mt-2">
                <p style={{ margin: 5 }}>
                  <strong>EMS-FD: </strong> {player.ems_fd}
                </p>
                <p style={{ margin: 5 }}>
                  <strong>Leo: </strong> {player.leo}
                </p>
                {player.Weapon ? (
                  <p style={{ margin: 5 }}>
                    <strong>Weapon: </strong> {player.Weapon}
                  </p>
                ) : null}
                <p style={{ margin: 5 }}>
                  <strong>Location: </strong> {player?.Location}
                </p>
                <p style={{ margin: 5 }}>
                  <strong>Vehicle: </strong> {player?.Vehicle || "On foot"}
                </p>
                {player["License Plate"] ? (
                  <p style={{ margin: 5 }}>
                    <strong>License plate: </strong> {player["License Plate"]}
                  </p>
                ) : null}
                <p style={{ margin: 5 }}>
                  <strong>Identifier: </strong> {player?.identifier}
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
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
