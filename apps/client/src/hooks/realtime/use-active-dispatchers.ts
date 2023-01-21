import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import useFetch from "lib/useFetch";
import { useDispatchState } from "state/dispatch/dispatch-state";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useRouter } from "next/router";
import type { GetDispatchData } from "@snailycad/types/api";
import { useActiveDispatcherState } from "state/dispatch/active-dispatcher-state";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function useActiveDispatchers() {
  const { ACTIVE_DISPATCHERS } = useFeatureEnabled();

  const { state, execute } = useFetch();
  const queryClient = useQueryClient();

  const router = useRouter();
  const isCitizen = router.pathname.includes("/citizen");

  const dispatchState = useDispatchState();
  const activeDispatcherState = useActiveDispatcherState();

  useQuery({
    queryKey: ["/dispatch"],
    enabled: !isCitizen,
    queryFn: getActiveDispatchers,
  });

  async function getActiveDispatchers() {
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

    return json;
  }

  useListener(
    { eventName: SocketEvents.UpdateDispatchersState, checkHasListeners: true },
    async () => {
      await queryClient.resetQueries(["/dispatch"]);
    },
  );

  return {
    state,
    activeDispatchersCount: activeDispatcherState.activeDispatchersCount,
    userActiveDispatcher: activeDispatcherState.userActiveDispatcher,
    hasActiveDispatchers: ACTIVE_DISPATCHERS
      ? activeDispatcherState.activeDispatchersCount > 0
      : true,
  };
}
