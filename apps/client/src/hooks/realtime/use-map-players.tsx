import * as React from "react";
import BN from "bignumber.js";
import type {
  DataActions,
  PlayerDataEvent,
  PlayerLeftEvent,
  MapPlayer,
  PlayerDataEventPayload,
} from "types/Map";
import { useAuth } from "context/AuthContext";
import useFetch from "lib/useFetch";
import { toastMessage } from "lib/toastMessage";
import type { cad } from "@snailycad/types";
import type { GetDispatchPlayerBySteamIdData } from "@snailycad/types/api";
import { io, Socket } from "socket.io-client";
import { create } from "zustand";

export const useMapPlayersStore = create<{
  players: Map<string, MapPlayer | PlayerDataEventPayload>;
  setPlayers(players: Map<string, MapPlayer | PlayerDataEventPayload>): void;
}>((set) => ({
  players: new Map<string, MapPlayer | PlayerDataEventPayload>(),
  setPlayers: (players: Map<string, MapPlayer | PlayerDataEventPayload>) => set({ players }),
}));

export function useMapPlayers() {
  const { players, setPlayers } = useMapPlayersStore();
  const [socket, setSocket] = React.useState<Socket | null>(null);

  const { cad } = useAuth();
  const url = getCADURL(cad);
  const { state, execute } = useFetch();

  const getCADUsers = React.useCallback(
    async (options: {
      map: Map<string, MapPlayer | PlayerDataEventPayload>;
      fetchMore?: boolean;
    }) => {
      if (state === "loading") return;

      const availablePlayersArray = Array.from(options.map.values());
      const newPlayers = options.map;
      const filteredPlayers = availablePlayersArray
        .filter((v) => v.convertedSteamId || v.discordId)
        .map((s) => ({
          steamId: s.convertedSteamId,
          discordId: s.discordId,
        }));

      if (options.fetchMore) {
        const { json: rawJson } = await execute<GetDispatchPlayerBySteamIdData[]>({
          path: "/dispatch/players",
          data: filteredPlayers,
          noToast: true,
          method: "POST",
        });

        const json = Array.isArray(rawJson) ? rawJson : [];

        for (const user of json) {
          const player = availablePlayersArray.find(
            (player) =>
              player.discordId === user.discordId || player.convertedSteamId === user.steamId,
          );

          if (player) {
            newPlayers.set(player.identifier, { ...player, ...user });
          }
        }
      }

      setPlayers(newPlayers);
    },
    [state], // eslint-disable-line
  );

  const onPlayerData = React.useCallback(
    async (data: PlayerDataEvent) => {
      const newMap = new Map(players);

      for (const player of data.payload) {
        const steamId = player.identifiers.steamId?.replace("steam:", "");
        const discordId = player.identifiers.discordId?.replace("discord:", "");

        const convertedSteamId = steamId && new BN(steamId, 16).toString();
        const identifier = discordId || steamId || String(player.playerId);

        const existingPlayer = newMap.get(identifier);

        if (existingPlayer) {
          const clone = {
            ...existingPlayer,
            ...player,
          };

          newMap.set(identifier, clone);
          continue;
        }

        newMap.set(identifier, {
          ...player,
          identifier,
          discordId,
          convertedSteamId,
        });
      }

      await getCADUsers({ map: newMap, fetchMore: data.payload.length !== players.size });
    },
    [players, getCADUsers],
  );

  const onPlayerLeft = React.useCallback(
    (data: PlayerLeftEvent) => {
      const newPlayers = players;
      const player = Array.from(players.values()).find((player) => player.name === data.payload);
      if (!player) return;

      players.delete(player.identifier);
      setPlayers(newPlayers);
    },
    [players], // eslint-disable-line react-hooks/exhaustive-deps
  );

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
        default: {
          break;
        }
      }
    },
    [onPlayerData, onPlayerLeft],
  );

  const onError = React.useCallback(
    (reason: Error) => {
      console.log({ reason });

      toastMessage({
        message: (
          <>
            Unable to make a Websocket connection to {url}.{" "}
            <a
              target="_blank"
              rel="noreferrer"
              className="underline text-blue-200"
              href="https://docs.snailycad.org/docs/fivem-integrations/live-map#connecting-to-snailycadv4"
            >
              See documentation.
            </a>
          </>
        ),
        title: "Connection Error",
        duration: 10_000,
      });
    },
    [url],
  );

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
      s.once("connect_error", onError);
    }

    return () => {
      s?.offAny(onMessage);
      s?.off("disconnect", console.log);
      s?.off("connect_error", onError);
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
        // eslint-disable-next-line quotes
        message: 'There was no "Live Map URL" provided from the CAD-Settings.',
      });
    warned = true;
    return null;
  }

  return liveMapURL;
}

function makeSocketConnection(url: string) {
  try {
    if (url.startsWith("ws")) {
      const _url = url.replace(/ws:\/\//, "http://").replace(/wss:\/\//, "https://");
      return io(_url);
    }

    return io(url);
  } catch (error) {
    const isSecurityError = error instanceof Error && error.name === "SecurityError";

    console.log({ error });

    if (isSecurityError) {
      toastMessage({
        message: `Unable to make a Websocket connection to ${url}. The connections are not secure.`,
        title: "Security Error",
        duration: Infinity,
      });
      return;
    }

    toastMessage({
      message: `Unable to make a Websocket connection to ${url}`,
      title: "Connection Error",
      duration: Infinity,
    });

    return null;
  }
}
