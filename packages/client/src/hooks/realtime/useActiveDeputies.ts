import * as React from "react";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { useAuth } from "context/AuthContext";
import useFetch from "lib/useFetch";
import { useDispatchState } from "state/dispatchState";
import { useEmsFdState } from "state/emsFdState";

export function useActiveDeputies() {
  const { user } = useAuth();
  const { activeDeputies, setActiveDeputies } = useDispatchState();
  const { state, execute } = useFetch();
  const { setActiveDeputy } = useEmsFdState();

  const getActiveDeputies = React.useCallback(async () => {
    const { json } = await execute("/ems-fd/active-deputies", {
      noToast: true,
    });

    if (json && Array.isArray(json)) {
      setActiveDeputies(json);

      const activeDeputy = json.find((v) => v.userId === user?.id);
      if (activeDeputy) {
        setActiveDeputy(activeDeputy);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  React.useEffect(() => {
    getActiveDeputies();
  }, [getActiveDeputies]);

  useListener(SocketEvents.UpdateEmsFdStatus, () => {
    getActiveDeputies();
  });

  return { activeDeputies, state };
}
