import * as React from "react";
import useFetch from "lib/useFetch";
import { useAuth } from "context/AuthContext";
import { ActiveWarrant, useLeoState } from "state/leoState";
import type { GetActiveWarrantsData } from "@snailycad/types/api";
import { SocketEvents } from "@snailycad/config";
import { useListener } from "@casper124578/use-socket.io";

let ran = false;
export function useActiveWarrants() {
  const { user } = useAuth();
  const { state, execute } = useFetch();
  const { activeWarrants, setActiveWarrants } = useLeoState();

  const handleState = React.useCallback(
    (data: any[]) => {
      setActiveWarrants(data);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const getActiveWarrants = React.useCallback(async () => {
    const { json } = await execute<GetActiveWarrantsData>({
      path: "/records/active-warrants",
      noToast: true,
    });

    if (json && Array.isArray(json)) {
      handleState(json);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, handleState]);

  React.useEffect(() => {
    if (!ran) {
      getActiveWarrants();
      ran = true;
    }
  }, [getActiveWarrants]);

  const isWarrantInArr = React.useCallback(
    (bolo: Pick<ActiveWarrant, "id">) => {
      return activeWarrants.some((v) => v.id === bolo.id);
    },
    [activeWarrants],
  );

  useListener(
    { eventName: SocketEvents.CreateActiveWarrant, checkHasListeners: true },
    (data: ActiveWarrant) => {
      if (!isWarrantInArr(data)) {
        setActiveWarrants([...[...activeWarrants], data]);
      }
    },
    [setActiveWarrants, activeWarrants],
  );

  useListener(
    { eventName: SocketEvents.UpdateActiveWarrant, checkHasListeners: true },
    (bolo: ActiveWarrant) => {
      setActiveWarrants(
        activeWarrants.map((v) => {
          if (v.id === bolo.id) {
            return bolo;
          }

          return v;
        }),
      );
    },
    [setActiveWarrants, activeWarrants],
  );

  return { activeWarrants, setActiveWarrants, state };
}
