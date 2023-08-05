import * as React from "react";
import BN from "bignumber.js";
import type {
  DataActions,
  PlayerDataEvent,
  PlayerLeftEvent,
  MapPlayer,
  PlayerDataEventPayload,
} from "types/map";
import useFetch from "lib/useFetch";
import { toastMessage } from "lib/toastMessage";
import type { GetDispatchPlayerBySteamIdData } from "@snailycad/types/api";
import { create } from "zustand";
import { useDispatchMapState, useSocketStore } from "state/mapState";
import { ModalIds } from "types/modal-ids";
import { useModal } from "state/modalState";
import { makeSocketConnection } from "components/dispatch/map/modals/select-map-server-modal";
import { ConnectionStatus } from "@snailycad/ui";

export const useMapPlayersStore = create<{
  players: Map<string, MapPlayer | PlayerDataEventPayload>;
  setPlayers(players: Map<string, MapPlayer | PlayerDataEventPayload>): void;
}>((set) => ({
  players: new Map<string, MapPlayer | PlayerDataEventPayload>(),
  setPlayers: (players: Map<string, MapPlayer | PlayerDataEventPayload>) => set({ players }),
}));

export function useMapPlayers() {
  const { players, setPlayers } = useMapPlayersStore();

  const { openModal, isOpen } = useModal();
  const { setStatus, currentMapServerURL } = useDispatchMapState();
  const { socket, setSocket } = useSocketStore();
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
      setStatus(ConnectionStatus.DISCONNECTED);

      toastMessage({
        message: (
          <>
            Unable to make a Websocket connection to {currentMapServerURL}.{" "}
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
    [currentMapServerURL], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const onConnect = React.useCallback(() => {
    setStatus(ConnectionStatus.CONNECTED);
    toastMessage({
      icon: "success",
      message: "Successfully connected to the server",
      title: "Connection Success",
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!currentMapServerURL) {
      openModal(ModalIds.SelectMapServer, { showAlert: true });
    } else if (!isOpen(ModalIds.SelectMapServer) && !socket?.connected) {
      socket?.close();

      const newSocket = makeSocketConnection(currentMapServerURL);
      if (newSocket) {
        setSocket(newSocket);
      }
    }
  }, [currentMapServerURL, socket?.connected]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    const s = socket;

    if (s) {
      s.onAny(onMessage);
      s.on("disconnect", console.log);
      s.once("connect_error", onError);
      s.on("connect", onConnect);
    }

    return () => {
      s?.offAny(onMessage);
      s?.off("disconnect", console.log);
      s?.off("connect_error", onError);
      s?.off("connect", onConnect);
    };
  }, [socket, onError, onMessage, onConnect]);

  return {
    players,
  };
}
