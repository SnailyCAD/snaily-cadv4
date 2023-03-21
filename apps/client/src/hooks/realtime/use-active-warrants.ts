import * as React from "react";
import { ActiveWarrant } from "state/leo-state";
import type { GetActiveWarrantsData } from "@snailycad/types/api";
import { SocketEvents } from "@snailycad/config";
import { useListener } from "@casper124578/use-socket.io";
import { useAsyncTable } from "components/shared/Table";

export function useActiveWarrants() {
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

  const isWarrantInArr = React.useCallback(
    (activeWarrant: Pick<ActiveWarrant, "id">) => {
      return asyncTable.items.some((v) => v.id === activeWarrant.id);
    },
    [asyncTable.items],
  );

  useListener(
    { eventName: SocketEvents.CreateActiveWarrant, checkHasListeners: true },
    (data: ActiveWarrant) => {
      if (!isWarrantInArr(data)) {
        asyncTable.prepend(data);
      }
    },
    [],
  );

  useListener(
    { eventName: SocketEvents.UpdateActiveWarrant, checkHasListeners: true },
    (activeWarrant: ActiveWarrant) => {
      asyncTable.update(activeWarrant.id, activeWarrant);
    },
    [],
  );

  return asyncTable;
}
