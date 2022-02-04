import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import useFetch from "lib/useFetch";
import * as React from "react";
import { FullOfficer, useDispatchState } from "state/dispatchState";
import type { CombinedLeoUnit } from "@snailycad/types";

export function useActiveOfficers(initOfficers: FullOfficer[] = []) {
  const [officers, setOfficers] = React.useState<FullOfficer[] | CombinedLeoUnit[]>(initOfficers);
  const { state, execute } = useFetch();
  const { setActiveOfficers } = useDispatchState();

  const getActiveOfficers = React.useCallback(async () => {
    const { json } = await execute("/leo/active-officers", {
      noToast: true,
    });

    if (json && Array.isArray(json)) {
      setOfficers(json);
      setActiveOfficers(json);
    }
  }, [execute, setActiveOfficers]);

  React.useEffect(() => {
    getActiveOfficers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useListener(SocketEvents.UpdateOfficerStatus, () => {
    getActiveOfficers();
  });

  return { activeOfficers: officers, state };
}
