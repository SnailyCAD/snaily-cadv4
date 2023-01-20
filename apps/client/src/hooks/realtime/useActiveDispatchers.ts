import * as React from "react";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import useFetch from "lib/useFetch";
import { useDispatchState } from "state/dispatch/dispatch-state";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useRouter } from "next/router";
import type { GetDispatchData } from "@snailycad/types/api";
import { useActiveDispatcherState } from "state/dispatch/active-dispatcher-state";

let ran = false;
export function useActiveDispatchers() {
  const router = useRouter();
  const isCitizen = router.pathname.includes("/citizen");

  const { state, execute } = useFetch();
  const dispatchState = useDispatchState();
  const activeDispatcherState = useActiveDispatcherState();

  const { ACTIVE_DISPATCHERS } = useFeatureEnabled();

  const getActiveDispatchers = React.useCallback(async () => {
    const { json } = await execute<GetDispatchData>({
      path: "/dispatch",
      noToast: true,
    });

    if (Array.isArray(json.activeIncidents)) {
      dispatchState.setActiveIncidents(json.activeIncidents);
    }

    if (typeof json.activeDispatchersCount === "number") {
      activeDispatcherState.setActiveDispatchersCount(json.activeDispatchersCount);
    }

    if (json.userActiveDispatcher) {
      activeDispatcherState.setUserActiveDispatcher(
        json.userActiveDispatcher,
        json.activeDispatchersCount,
      );
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!ran && !isCitizen) {
      getActiveDispatchers();
      ran = true;
    }
  }, [isCitizen, getActiveDispatchers]);

  useListener({ eventName: SocketEvents.UpdateDispatchersState, checkHasListeners: true }, () => {
    getActiveDispatchers();
  });

  return {
    state,
    activeDispatchersCount: activeDispatcherState.activeDispatchersCount,
    userActiveDispatcher: activeDispatcherState.userActiveDispatcher,
    hasActiveDispatchers: ACTIVE_DISPATCHERS
      ? activeDispatcherState.activeDispatchersCount > 0
      : true,
  };
}
