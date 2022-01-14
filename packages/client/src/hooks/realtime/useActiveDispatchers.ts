import * as React from "react";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import useFetch from "lib/useFetch";
import { useDispatchState } from "state/dispatchState";
import { ActiveDispatchers } from "types/prisma";

export function useActiveDispatchers(initDeputies: ActiveDispatchers[] = []) {
  const [dispatchers, setActiveDispatchers] = React.useState(initDeputies);
  const { state, execute } = useFetch();
  const dispatchState = useDispatchState();

  const getActiveDispatchers = React.useCallback(async () => {
    const { json } = await execute("/dispatch", {
      noToast: true,
    });

    if (json && "activeDispatchers" in json) {
      setActiveDispatchers(json.activeDispatchers);
      dispatchState.setActiveDispatchers(json.activeDispatchers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute, dispatchState.setActiveDispatchers]);

  React.useEffect(() => {
    getActiveDispatchers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useListener(SocketEvents.UpdateDispatchersState, () => {
    getActiveDispatchers();
  });

  return { activeDispatchers: dispatchers, state };
}
