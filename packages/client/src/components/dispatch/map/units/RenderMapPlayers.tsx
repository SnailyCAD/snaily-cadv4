import type { cad } from "@snailycad/types";
import { useAuth } from "context/AuthContext";
import { toastError } from "lib/error";
import { convertToMap } from "lib/map/utils";
import * as React from "react";
import { Marker, Popup, useMap } from "react-leaflet";
import type { DataActions, PlayerDataEvent, PlayerLeftEvent } from "types/Map";

export function RenderMapPlayers() {
  const [players, setPlayers] = React.useState<PlayerDataEvent["payload"]>([]);
  const [socket, setSocket] = React.useState<WebSocket | null>(null);

  const { cad } = useAuth();
  const url = getCADURL(cad);
  const map = useMap();

  const onPlayerData = React.useCallback((data: PlayerDataEvent) => {
    setPlayers(data.payload);
  }, []);

  const onPlayerLeft = React.useCallback((data: PlayerLeftEvent) => {
    console.log({ data });

    setPlayers((p) => p.filter((v) => v.identifier !== data.payload));
  }, []);

  const onMessage = React.useCallback(
    (e: MessageEvent) => {
      const data = JSON.parse(e.data) as DataActions;

      switch (data.type) {
        case "playerData": {
          onPlayerData(data);
          break;
        }
        case "playerLeft": {
          onPlayerLeft(data);
          break;
        }
        default:
          break;
      }
    },
    [onPlayerData, onPlayerLeft],
  );

  const onError = React.useCallback(() => {
    toastError({
      message: `Unable to make a Websocket connection to ${url}`,
      title: "Connection Error",
      duration: 10_000,
    });
  }, [url]);

  React.useEffect(() => {
    if (!socket && url) {
      setSocket(new WebSocket(url));
    }
  }, [url, socket]);

  React.useEffect(() => {
    const s = socket;

    if (s) {
      socket.addEventListener("message", onMessage);
      socket.addEventListener("error", onError);
    }

    return () => {
      s?.removeEventListener("message", onMessage);
      s?.removeEventListener("error", onError);
    };
  }, [socket, onError, onMessage]);

  return (
    <>
      {players.map((player, idx) => {
        const pos = player.pos?.x && player.pos.y && convertToMap(player.pos.x, player.pos.y, map);
        if (!pos) return null;

        return (
          <Marker key={idx} position={pos}>
            <Popup minWidth={500}>
              <p style={{ margin: 2 }}>
                <strong>Player:</strong> {player.name}
              </p>
              <div className="info-body mt-2">
                {/* <p style={{ margin: 2 }}>
                  <strong>EMS-FD: </strong> {player.ems_fd}
                </p>
                <p style={{ margin: 2 }}>
                  <strong>Leo: </strong> {player.leo}
                </p> */}
                {player.Weapon ? (
                  <p style={{ margin: 2 }}>
                    <strong>Weapon: </strong> {player.Weapon}
                  </p>
                ) : null}
                <p style={{ margin: 2 }}>
                  <strong>Location: </strong> {player?.Location}
                </p>
                <p style={{ margin: 2 }}>
                  <strong>Vehicle: </strong> {player?.Vehicle || "On foot"}
                </p>
                {player["License Plate"] ? (
                  <p style={{ margin: 2 }}>
                    <strong>License plate: </strong> {player["License Plate"]}
                  </p>
                ) : null}
                <p style={{ margin: 2 }}>
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
