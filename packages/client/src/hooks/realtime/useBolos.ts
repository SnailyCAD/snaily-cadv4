import * as React from "react";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { type FullBolo, useDispatchState } from "state/dispatchState";
import type { Bolo } from "@snailycad/types";

export function useBolos() {
  const { bolos, setBolos } = useDispatchState();

  useListener(
    { eventName: SocketEvents.CreateBolo, checkHasListeners: true },
    (data) => {
      if (!isBoloInArr(data)) {
        setBolos([...[...bolos], data]);
      }
    },
    [setBolos, bolos],
  );

  useListener(
    { eventName: SocketEvents.DeleteBolo, checkHasListeners: true },
    (bolo: Pick<Bolo, "id">) => {
      setBolos(bolos.filter((v) => v.id !== bolo.id));
    },
    [setBolos, bolos],
  );

  useListener(
    { eventName: SocketEvents.UpdateBolo, checkHasListeners: true },
    (bolo: FullBolo) => {
      setBolos(
        bolos.map((v) => {
          if (v.id === bolo.id) {
            return bolo;
          }

          return v;
        }),
      );
    },
    [setBolos, bolos],
  );

  const isBoloInArr = React.useCallback(
    (bolo: Pick<Bolo, "id">) => {
      return bolos.some((v) => v.id === bolo.id);
    },
    [bolos],
  );

  return { bolos, setBolos };
}
