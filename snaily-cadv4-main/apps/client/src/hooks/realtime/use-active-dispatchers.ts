import { useListener } from "@casperiv/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import useFetch from "lib/useFetch";
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
  const activeDispatcherState = useActiveDispatcherState((state) => ({
    activeDispatchersCount: state.activeDispatchersCount,
    userActiveDispatcher: state.userActiveDispatcher,
    setActiveDispatchersCount: state.setActiveDispatchersCount,
    setUserActiveDispatcher: state.setUserActiveDispatcher,
  }));

  useQuery({
    queryKey: ["/dispatch"],
    enabled: !isCitizen,
    queryFn: getActiveDispatchers,
    refetchOnMount: false,
  });

  async function getActiveDispatchers() {
    const { json } = await execute<GetDispatchData>({
      path: "/dispatch",
      noToast: true,
    });

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
      await queryClient.resetQueries({ queryKey: ["/dispatch"] });
    },
    [queryClient.resetQueries],
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
