import { cad, EmsFdDeputy, Officer, Rank, User } from "@snailycad/types";
import { useAuth } from "context/AuthContext";
import { toastMessage } from "lib/toastMessage";
import { convertToMap } from "lib/map/utils";
import * as React from "react";
import { Marker, Popup, Tooltip, useMap } from "react-leaflet";
import type { DataActions, PlayerDataEvent, PlayerLeftEvent } from "types/Map";
import L from "leaflet";
import BN from "bignumber.js";
import useFetch from "lib/useFetch";
import { defaultPermissions, hasPermission } from "@snailycad/permissions";
import { ActiveMapUnits } from "./ActiveMapUnits";
import { Button } from "components/Button";

const PLAYER_ICON = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.0/dist/images/marker-icon-2x.png",
  iconSize: [25, 40],
  popupAnchor: [0, 0],
  iconAnchor: [9, 8],
});

export type PlayerDataEventPayload = PlayerDataEvent["payload"][number];
export interface MapPlayer extends User, PlayerDataEventPayload {
  unit: EmsFdDeputy | Officer | null;
  convertedSteamId: string | null;
}

export function RenderMapPlayers() {
  const [players, setPlayers] = React.useState<(MapPlayer | PlayerDataEventPayload)[]>([]);
  const [socket, setSocket] = React.useState<WebSocket | null>(null);
  const [openItems, setOpenItems] = React.useState<string[]>([]);

  const { cad } = useAuth();
  const url = getCADURL(cad);
  const map = useMap();
  const { execute } = useFetch();

  const handleSearchPlayer = React.useCallback(
    async (steamId: string | null, player: PlayerDataEventPayload) => {
      const existing = players.find((v) =>
        "steamId" in v ? v.steamId === steamId : v.identifier === player.identifier,
      );
      if (existing) {
        const copied = [...players];
        const idx = copied.findIndex((v) => v.identifier === player.identifier);

        copied[idx] = { ...existing, ...player, convertedSteamId: steamId };
        setPlayers(copied);

        return;
      }

      const { json } = await execute(`/dispatch/players/${steamId}`, {
        method: "GET",
      });

      if (!json.steamId) {
        setPlayers((p) => [...p, player]);
        return;
      }

      const data = { ...player, ...json, convertedSteamId: steamId };
      setPlayers((p) => [...p, data]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [players],
  );

  const onPlayerData = React.useCallback(
    async (data: PlayerDataEvent) => {
      for (const player of data.payload) {
        if (!player.identifier) continue;
        if (!player.identifier.startsWith("steam:")) {
          await handleSearchPlayer(null, player);
          continue;
        }

        const steamId = player.identifier.replace("steam:", "");
        const convertedSteamId = new BN(steamId, 16).toString();

        await handleSearchPlayer(convertedSteamId, player);
      }
    },
    [handleSearchPlayer],
  );

  const onPlayerLeft = React.useCallback((data: PlayerLeftEvent) => {
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
    toastMessage({
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
      {players.map((player) => {
        const pos = player.pos?.x && player.pos.y && convertToMap(player.pos.x, player.pos.y, map);
        if (!pos) return null;

        const isCADUser = "steamId" in player;

        const hasLeoPermissions =
          isCADUser &&
          (player.rank === Rank.OWNER ||
            (player.permissions
              ? hasPermission(player.permissions, defaultPermissions.defaultLeoPermissions)
              : player.isLeo));

        const hasEmsFdPermissions =
          isCADUser &&
          (player.rank === Rank.OWNER ||
            (player.permissions
              ? hasPermission(player.permissions, defaultPermissions.defaultEmsFdPermissions)
              : player.isEmsFd));

        return (
          <Marker icon={PLAYER_ICON} key={player.identifier} position={pos}>
            <Tooltip direction="top">{player.name}</Tooltip>

            <Popup minWidth={500}>
              <p style={{ margin: 2 }}>
                <strong>Player:</strong> {player.name}
              </p>
              {isCADUser ? (
                <>
                  <p style={{ margin: 2 }}>
                    <strong>CAD Username: </strong> {player.username}
                  </p>

                  <p style={{ margin: 2 }}>
                    <strong>EMS-FD: </strong> {String(hasEmsFdPermissions)}
                  </p>
                  <p style={{ margin: 2 }}>
                    <strong>Leo: </strong> {String(hasLeoPermissions)}
                  </p>
                </>
              ) : null}

              {player.Weapon ? (
                <p style={{ margin: 2 }}>
                  <strong>Weapon: </strong> {player.Weapon}
                </p>
              ) : null}
              <p style={{ margin: 2 }}>
                <strong>Location: </strong> {player.Location}
              </p>
              <p style={{ margin: 2 }}>
                <strong>Vehicle: </strong> {player.Vehicle || "On foot"}
              </p>
              {player["License Plate"] ? (
                <p style={{ margin: 2 }}>
                  <strong>License plate: </strong> {player["License Plate"]}
                </p>
              ) : null}
              <p style={{ margin: 2 }}>
                <strong>Identifier: </strong> {player.identifier}
              </p>

              {"id" in player ? (
                <div className="mt-3">
                  <Button small className="!text-base" onClick={() => handleToggle(player.id)}>
                    {"togglePlayer"}
                  </Button>
                </div>
              ) : null}
            </Popup>
          </Marker>
        );
      })}

      <ActiveMapUnits setOpenItems={setOpenItems} openItems={openItems} players={players} />
    </>
  );
}

let warned = false;
function getCADURL(cad: cad | null) {
  if (!cad) return null;

  const liveMapURL = cad.miscCadSettings?.liveMapURL;

  if (!liveMapURL) {
    !warned &&
      toastMessage({
        duration: Infinity,
        message: "There was no live_map_url provided from the CAD-Settings.",
      });
    warned = true;
    return null;
  }

  if (!liveMapURL.startsWith("ws")) {
    !warned &&
      toastMessage({
        duration: Infinity,
        message: "The live_map_url did not start with ws. Make sure it is a WebSocket protocol",
      });
    warned = true;

    return null;
  }

  return liveMapURL;
}
