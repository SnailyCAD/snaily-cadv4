import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import useFetch from "lib/useFetch";
import * as React from "react";
import { FullOfficer } from "state/dispatchState";

export function useActiveOfficers(initOfficers: FullOfficer[] = []) {
  const [officers, setOfficers] = React.useState(initOfficers);
  const { state, execute } = useFetch();

  const getActiveOfficers = React.useCallback(async () => {
    const { json } = await execute("/leo/active-officers", {
      noToast: true,
    });

    if (json && Array.isArray(json)) {
      setOfficers(json);
    }
  }, [execute]);

  React.useEffect(() => {
    getActiveOfficers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useListener(SocketEvents.UpdateOfficerStatus, () => {
    getActiveOfficers();
  });

  return { activeOfficers: officers, state };
}
