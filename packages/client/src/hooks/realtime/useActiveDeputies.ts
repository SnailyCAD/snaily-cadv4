import * as React from "react";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { useAuth } from "context/AuthContext";
import useFetch from "lib/useFetch";
import { useDispatchState } from "state/dispatch/dispatchState";
import { useEmsFdState } from "state/emsFdState";
import type { EmsFdDeputy } from "@snailycad/types";
import type { GetEmsFdActiveDeputies } from "@snailycad/types/api";

export function useActiveDeputies() {
  const { user } = useAuth();
  const { activeDeputies, setActiveDeputies } = useDispatchState();
  const { state, execute } = useFetch();
  const { setActiveDeputy } = useEmsFdState();

  const handleState = React.useCallback(
    (data: EmsFdDeputy[]) => {
      setActiveDeputies(data);

      const activeDeputy = data.find((v) => v.userId === user?.id);
      if (activeDeputy) {
        setActiveDeputy(activeDeputy);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id],
  );

  const getActiveDeputies = React.useCallback(async () => {
    const { json } = await execute<GetEmsFdActiveDeputies>({
      path: "/ems-fd/active-deputies",
      noToast: true,
    });

    if (json && Array.isArray(json)) {
      handleState(json);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, handleState]);

  React.useEffect(() => {
    getActiveDeputies();
  }, [getActiveDeputies]);

  useListener(SocketEvents.UpdateEmsFdStatus, (data: EmsFdDeputy[] | null) => {
    if (data && Array.isArray(data)) {
      handleState(data);
      return;
    }

    getActiveDeputies();
  });

  return { activeDeputies, setActiveDeputies, state };
}
