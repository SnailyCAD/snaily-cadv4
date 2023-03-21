import * as React from "react";
import useFetch from "lib/useFetch";
import { useAuth } from "context/AuthContext";
import { ActiveWarrant, useLeoState } from "state/leo-state";
import type { GetActiveWarrantsData } from "@snailycad/types/api";
import { SocketEvents } from "@snailycad/config";
import { useListener } from "@casper124578/use-socket.io";
import { shallow } from "zustand/shallow";
import { useAsyncTable } from "components/shared/Table";

let ran = false;
export function useActiveWarrants() {
  const { user } = useAuth();
  const { state, execute } = useFetch();

  const asyncTable = useAsyncTable<ActiveWarrant>({
    scrollToTopOnDataChange: false,
    fetchOptions: {
      pageSize: 12,
      path: "/records/active-warrants",
      onResponse: (json: GetActiveWarrantsData) => ({
        data: json.activeWarrants,
        totalCount: json.totalCount,
      }),
    },
  });

  const { activeWarrants, setActiveWarrants } = useLeoState(
    (state) => ({
      activeWarrants: state.activeWarrants,
      setActiveWarrants: state.setActiveWarrants,
    }),
    shallow,
  );

  const handleState = React.useCallback(
    (data: ActiveWarrant[]) => {
      asyncTable.setItems(data);
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
    (activeWarrant: Pick<ActiveWarrant, "id">) => {
      return activeWarrants.some((v) => v.id === activeWarrant.id);
    },
    [activeWarrants],
  );

  useListener(
    { eventName: SocketEvents.CreateActiveWarrant, checkHasListeners: true },
    (data: ActiveWarrant) => {
      if (!isWarrantInArr(data)) {
        asyncTable.append(data);
      }
    },
    [setActiveWarrants, activeWarrants],
  );

  useListener(
    { eventName: SocketEvents.UpdateActiveWarrant, checkHasListeners: true },
    (activeWarrant: ActiveWarrant) => {
      asyncTable.update(activeWarrant.id, activeWarrant);
    },
    [setActiveWarrants, activeWarrants],
  );

  return { asyncTable, state };
}
