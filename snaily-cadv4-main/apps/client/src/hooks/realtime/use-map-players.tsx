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
import { useDispatchMapState, useSocketStore } from "state/mapState";
import { ModalIds } from "types/modal-ids";
import { useModal } from "state/modalState";
import { makeSocketConnection } from "components/dispatch/map/modals/select-map-server-modal";
import { ConnectionStatus } from "@snailycad/ui";
import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/shallow";
import { useMutation } from "@tanstack/react-query";
import type { EmsFdDeputy, Officer } from "@snailycad/types";
import { useListener } from "@casperiv/use-socket.io";
import { SocketEvents } from "@snailycad/config";

export const useMapPlayersStore = createWithEqualityFn<{
  players: Map<string, MapPlayer | PlayerDataEventPayload>;
  setPlayers(players: Map<string, MapPlayer | PlayerDataEventPayload>): void;
}>(
  (set) => ({
    players: new Map<string, MapPlayer | PlayerDataEventPayload>(),
    setPlayers: (players: Map<string, MapPlayer | PlayerDataEventPayload>) => set({ players }),
  }),
  shallow,
);

export function useMapPlayers() {
  const { players, setPlayers } = useMapPlayersStore();

  const currentMapServerURL = useDispatchMapState((state) => state.currentMapServerURL);
  const setActiveMapUnits = useDispatchMapState((state) => state.setActiveMapUnits);
  const modalState = useModal();
  const { state, execute } = useFetch();
  const { socket, setStatus, setSocket } = useSocketStore((state) => ({
    socket: state.socket,
    setStatus: state.setStatus,
    setSocket: state.setSocket,
  }));

  const getCadUsersQuery = useMutation<
    unknown,
    Error,
    {
      map: Map<string, MapPlayer | PlayerDataEventPayload>;
      fetchMore?: boolean;
    }
  >({
    mutationKey: ["get-cad-users", "live-map"],
    mutationFn: async (options) => {
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
        const { json: rawJson } = await execute({
          path: "/dispatch/players",
          data: filteredPlayers,
          noToast: true,
          method: "POST",
        });

        const json = Array.isArray(rawJson) ? rawJson : [];
        const units = new Map<string, EmsFdDeputy | Officer>();

        for (const user of json) {
          const player = availablePlayersArray.find(
            (player) =>
              player.discordId === user.discordId || player.convertedSteamId === user.steamId,
          );

          if (user.unit) {
            units.set(user.unit.id, user.unit);
          }

          if (player) {
            newPlayers.set(player.identifier, { ...player, ...user });
          }
        }

        setActiveMapUnits(Array.from(units.values()));
      }

      setPlayers(options.map);
    },
  });

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

      await getCadUsersQuery.mutateAsync({
        map: newMap,
        fetchMore: data.payload.length !== players.size,
      });
    },
    [players, getCadUsersQuery],
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

  useListener(SocketEvents.UpdateOfficerStatus, () => {
    getCadUsersQuery.mutate({
      map: new Map(players),
      // We have to fetch more to get the latest unit information
      fetchMore: true,
    });
  });

  useListener(SocketEvents.UpdateEmsFdStatus, () => {
    getCadUsersQuery.mutate({
      map: new Map(players),
      // We have to fetch more to get the latest unit information
      fetchMore: true,
    });
  });

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
      modalState.openModal(ModalIds.SelectMapServer, { showAlert: true });
    } else if (!modalState.isOpen(ModalIds.SelectMapServer) && !socket?.connected) {
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
