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
import { omit } from "lib/utils";

export function useMapPlayers() {
  const [players, setPlayers] = React.useState<(MapPlayer | PlayerDataEventPayload)[]>([]);
  const [socket, setSocket] = React.useState<WebSocket | null>(null);

  const { cad } = useAuth();
  const url = getCADURL(cad);
  const { execute } = useFetch();

  const handleSearchPlayer = React.useCallback(
    async (steamId: string | null, player: PlayerDataEventPayload) => {
      const existing = players.find((v) =>
        "steamId" in v ? v.steamId === steamId : v.identifier === player.identifier,
      );

      if (existing) {
        const copied = [...players];
        const idx = copied.findIndex((v) => v.identifier === player.identifier);

        const omittedExisting = omit(existing, [
          "License Plate",
          "Vehicle",
          "Location",
          "Weapon",
          "icon",
          "pos",
        ]);

        copied[idx] = { ...omittedExisting, ...player, convertedSteamId: steamId };
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
