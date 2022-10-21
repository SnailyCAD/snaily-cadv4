import * as React from "react";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import useFetch from "lib/useFetch";
import { useDispatchState } from "state/dispatch/dispatchState";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useRouter } from "next/router";
import type { GetDispatchData } from "@snailycad/types/api";

let ran = false;
export function useActiveDispatchers() {
  const router = useRouter();
  const isCitizen = router.pathname.includes("/citizen");

  const { state, execute } = useFetch();
  const dispatchState = useDispatchState();

  const { ACTIVE_DISPATCHERS } = useFeatureEnabled();

  const getActiveDispatchers = React.useCallback(async () => {
    const { json } = await execute<GetDispatchData>({
      path: "/dispatch",
      noToast: true,
    });

    if (json.activeDispatchers) {
      dispatchState.setActiveDispatchers(json.activeDispatchers);
      dispatchState.setActiveIncidents(json.activeIncidents);
      dispatchState.setAllOfficers(json.officers.officers);
      dispatchState.setAllDeputies(json.deputies);
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
    activeDispatchers: dispatchState.activeDispatchers,
    state,
    hasActiveDispatchers: ACTIVE_DISPATCHERS ? dispatchState.activeDispatchers.length >= 1 : true,
    setActiveDispatchers: dispatchState.setActiveDispatchers,
  };
}
