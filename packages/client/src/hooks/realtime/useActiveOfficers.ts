import * as React from "react";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import useFetch from "lib/useFetch";
import { useDispatchState } from "state/dispatchState";
import { useAuth } from "context/AuthContext";
import { useLeoState } from "state/leoState";

export function useActiveOfficers() {
  const { user } = useAuth();
  const { activeOfficers, setActiveOfficers } = useDispatchState();
  const { state, execute } = useFetch();
  const { setActiveOfficer } = useLeoState();

  const getActiveOfficers = React.useCallback(async () => {
    const { json } = await execute("/leo/active-officers", {
      noToast: true,
    });

    if (json && Array.isArray(json)) {
      setActiveOfficers(json);

      const activeOfficer = json.find((v) => v.userId === user?.id);
      if (activeOfficer) {
        setActiveOfficer(activeOfficer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  React.useEffect(() => {
    getActiveOfficers();
  }, [getActiveOfficers]);

  useListener(SocketEvents.UpdateOfficerStatus, () => {
    getActiveOfficers();
  });

  return { activeOfficers, setActiveOfficers, state };
}
