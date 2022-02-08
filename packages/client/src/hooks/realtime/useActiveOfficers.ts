import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import useFetch from "lib/useFetch";
import * as React from "react";
import { FullOfficer, useDispatchState } from "state/dispatchState";
import type { CombinedLeoUnit } from "@snailycad/types";
import { useAuth } from "context/AuthContext";
import { useLeoState } from "state/leoState";

export function useActiveOfficers(initOfficers: FullOfficer[] = []) {
  const { user } = useAuth();
  const [officers, setOfficers] = React.useState<FullOfficer[] | CombinedLeoUnit[]>(initOfficers);
  const { state, execute } = useFetch();
  const { setActiveOfficers } = useDispatchState();
  const { setActiveOfficer } = useLeoState();

  const getActiveOfficers = React.useCallback(async () => {
    const { json } = await execute("/leo/active-officers", {
      noToast: true,
    });

    if (json && Array.isArray(json)) {
      setOfficers(json);
      setActiveOfficers(json);

      const activeOfficer = json.find((v) => v.userId === user?.id);
      if (activeOfficer) {
        setActiveOfficer(activeOfficer);
      }
    }
  }, [execute, setActiveOfficers, setActiveOfficer, user?.id]);

  React.useEffect(() => {
    getActiveOfficers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useListener(SocketEvents.UpdateOfficerStatus, () => {
    getActiveOfficers();
  });

  return { activeOfficers: officers, state };
}
