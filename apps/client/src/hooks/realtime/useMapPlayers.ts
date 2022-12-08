import * as React from "react";
import BN from "bignumber.js";
import type {
  DataActions,
  PlayerDataEvent,
  PlayerLeftEvent,
  MapPlayer,
  PlayerDataEventPayload,
  Player,
} from "types/Map";
import { useAuth } from "context/AuthContext";
import useFetch from "lib/useFetch";
import { toastMessage } from "lib/toastMessage";
import type { cad } from "@snailycad/types";
import { omit } from "lib/utils";
import type { GetDispatchPlayerBySteamIdData } from "@snailycad/types/api";

export function useMapPlayers() {
  const [players, setPlayers] = React.useState<Map<string, MapPlayer | PlayerDataEventPayload>>(
    new Map<string, MapPlayer | PlayerDataEventPayload>(),
  );
  const [socket, setSocket] = React.useState<WebSocket | null>(null);
  const [prevPlayerData, setPrevPlayerData] = React.useState<GetDispatchPlayerBySteamIdData[]>([]);

  const { cad } = useAuth();
  const url = getCADURL(cad);
  const { execute } = useFetch();

  const getCADUsers = React.useCallback(
    async (
      steamIds: (Player & { convertedSteamId?: string | null })[],
      payload: PlayerDataEventPayload[],
    ) => {
      let _prevPlayerData = prevPlayerData;

      const { json } =
        steamIds.length <= 0
          ? { json: prevPlayerData }
          : await execute<GetDispatchPlayerBySteamIdData[]>({
              path: "/dispatch/players",
              params: {
                steamIds: steamIds.map((s) => s.convertedSteamId).join(","),
              },
              noToast: true,
            });

      if (steamIds.length >= 1) {
        _prevPlayerData = json;
        setPrevPlayerData(json);
      }

      const newMap = new Map();

      for (const player of payload) {
        const steamId = steamIds.find((v) => v.identifier === player.identifier)?.convertedSteamId;
        const user = _prevPlayerData.find((v) => v.steamId === steamId);
        const existing = players.get(player.identifier);

        if (existing) {
          const omittedExisting = omit(existing, [
            "License Plate",
            "Vehicle",
            "Location",
            "Weapon",
            "icon",
            "pos",
          ]);

          newMap.set(String(player.identifier), {
            ...omittedExisting,
            ...existing,
            ...player,
          });

          continue;
        }

        if (!player.identifier) continue;
        newMap.set(player.identifier, { convertedSteamId: steamId, ...player, ...user });
      }

      setPlayers(newMap);
    },
    [players, prevPlayerData], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const onPlayerData = React.useCallback(
    async (data: PlayerDataEvent) => {
      const usersToFetch = data.payload
        .map((player) => {
          const steamId = player.identifier?.replace("steam:", "");
          const convertedSteamId = new BN(steamId, 16).toString();
          return { ...player, convertedSteamId };
        })
        .filter((player) => {
          if (players.has(player.identifier)) return false;
          if (player.identifier?.startsWith("steam:")) return true;
          return false;
        });

      await getCADUsers(usersToFetch, data.payload);
    },
    [getCADUsers, players],
  );

  const onPlayerLeft = React.useCallback((data: PlayerLeftEvent) => {
    setPlayers((map) => {
      map.delete(data.payload);
      return map;
    });
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
      const newSocket = makeSocketConnection(url);

      if (newSocket) {
        setSocket(newSocket);
      }
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

  return {
    players,
  };
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

function makeSocketConnection(url: string) {
  try {
    return new WebSocket(url);
  } catch (error) {
    const isSecurityError = error instanceof Error && error.name === "SecurityError";

    if (isSecurityError) {
      toastMessage({
        message: `Unable to make a Websocket connection to ${url}. The connections are not secure.`,
        title: "Security Error",
        duration: Infinity,
      });
    }

    toastMessage({
      message: `Unable to make a Websocket connection to ${url}`,
      title: "Connection Error",
      duration: Infinity,
    });

    return null;
  }
}
