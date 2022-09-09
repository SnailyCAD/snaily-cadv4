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

  const { cad } = useAuth();
  const url = getCADURL(cad);
  const { execute, state } = useFetch();

  const getCADUsers = React.useCallback(
    async (steamIds: (Player & { convertedSteamId?: string | null })[]) => {
      if (steamIds.length <= 0) return;

      const { json } = await execute<GetDispatchPlayerBySteamIdData[]>({
        path: "/dispatch/players",
        params: {
          steamIds: steamIds.map((s) => s.convertedSteamId).join(","),
        },
        noToast: true,
      });

      for (const player of steamIds) {
        const user = json.find((v) => v.steamId === player.convertedSteamId);

        const existing = players.get(player.identifier);
        if (existing) {
          const copied = new Map(players);

          const omittedExisting = omit(existing, [
            "License Plate",
            "Vehicle",
            "Location",
            "Weapon",
            "icon",
            "pos",
          ]);

          copied.set(String(player.identifier), {
            ...omittedExisting,
            ...existing,
            ...player,
          });
          setPlayers(copied);

          return;
        }

        setPlayers((map) => {
          map.set(player.identifier, { ...player, ...user });
          return map;
        });
      }
    },
    [players], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const onPlayerData = React.useCallback(
    async (data: PlayerDataEvent) => {
      const usersToFetch = [];
      const map = new Map(players);

      for (const player of data.payload) {
        const previous = players.get(player.identifier);
        if (previous) {
          map.set(player.identifier, { ...previous, ...player });
          continue;
        }

        if (!player.identifier || !player.identifier.startsWith("steam:")) {
          map.set(player.identifier, player);
          continue;
        }

        const steamId = player.identifier.replace("steam:", "");
        const convertedSteamId = new BN(steamId, 16).toString();
        usersToFetch.push({ ...player, convertedSteamId });
      }

      setPlayers(map);

      if (state === "loading") return;

      await getCADUsers(usersToFetch);
    },
    [getCADUsers, state, players],
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
