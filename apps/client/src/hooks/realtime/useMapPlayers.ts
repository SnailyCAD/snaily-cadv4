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
import { io, Socket } from "socket.io-client";

export function useMapPlayers() {
  const [players, setPlayers] = React.useState<Map<number, MapPlayer | PlayerDataEventPayload>>(
    new Map<number, MapPlayer | PlayerDataEventPayload>(),
  );
  const [socket, setSocket] = React.useState<Socket | null>(null);
  const [prevPlayerData, setPrevPlayerData] = React.useState<GetDispatchPlayerBySteamIdData[]>([]);

  const { cad } = useAuth();
  const url = getCADURL(cad);
  const { execute } = useFetch();

  const getCADUsers = React.useCallback(
    async (
      playersToFetch: (Player & { discordId?: string | null; convertedSteamId?: string | null })[],
      payload: PlayerDataEventPayload[],
    ) => {
      let _prevPlayerData = prevPlayerData;

      const { json } =
        playersToFetch.length <= 0
          ? { json: prevPlayerData }
          : await execute<GetDispatchPlayerBySteamIdData[]>({
              path: "/dispatch/players",
              data: playersToFetch.map((s) => ({
                steamId: s.convertedSteamId,
                discordId: s.discordId,
              })),
              noToast: true,
              method: "POST",
            });

      if (playersToFetch.length >= 1) {
        _prevPlayerData = json;
        setPrevPlayerData(json);
      }

      const newMap = new Map();

      for (const player of payload) {
        const currentPlayer = playersToFetch.find(
          (v) =>
            v.identifiers.steamId === player.identifiers.steamId ||
            v.identifiers.discordId === player.identifiers.discordId,
        );

        const steamId = currentPlayer?.convertedSteamId;
        const discordId = currentPlayer?.discordId;

        const user = _prevPlayerData.find(
          (v) => v.steamId === steamId || v.discordId === discordId,
        );
        const existing = players.get(player.playerId);

        if (existing) {
          const omittedExisting = omit(existing, [
            "licensePlate",
            "vehicle",
            "location",
            "weapon",
            "icon",
            "pos",
          ]);

          newMap.set(player.playerId, {
            ...omittedExisting,
            ...existing,
            ...player,
          });

          continue;
        }

        if (!player.playerId) continue;
        newMap.set(player.playerId, {
          convertedSteamId: currentPlayer?.convertedSteamId,
          ...player,
          ...user,
        });
      }

      setPlayers(newMap);
    },
    [players, prevPlayerData], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const onPlayerData = React.useCallback(
    async (data: PlayerDataEvent) => {
      const usersToFetch = data.payload
        .map((player) => {
          const steamId = player.identifiers.steamId?.replace("steam:", "");
          const discordId = player.identifiers.discordId?.replace("discord:", "");

          const convertedSteamId = steamId && new BN(steamId, 16).toString();
          return {
            ...player,
            id: (convertedSteamId || discordId)!,
            discordId,
            convertedSteamId,
          };
        })
        .filter(
          (player) =>
            (player.convertedSteamId || player.discordId) && !players.get(player.playerId),
        );

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
    (_name: string, data: DataActions) => {
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
      s.onAny(onMessage);
      s.on("disconnect", console.log);
    }

    return () => {
      s?.offAny(onMessage);
      s?.off("disconnect", console.log);
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
    const _url = url.replace(/ws:\/\//, "http://").replace(/wss:\/\//, "https://");
    return io(_url);
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
