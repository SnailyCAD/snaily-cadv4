import * as React from "react";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import useFetch from "lib/useFetch";
import { useDispatchState } from "state/dispatchState";
import { useAuth } from "context/AuthContext";
import { useLeoState } from "state/leoState";
import type { Officer } from "@snailycad/types";

let ran = false;
export function useActiveOfficers() {
  const { user } = useAuth();
  const { activeOfficers, setActiveOfficers } = useDispatchState();
  const { state, execute } = useFetch();
  const { setActiveOfficer } = useLeoState();

  const handleState = React.useCallback(
    (data: Officer[]) => {
      setActiveOfficers(data);

      const activeOfficer = data.find((v) => v.userId === user?.id);
      if (activeOfficer) {
        setActiveOfficer(activeOfficer);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id],
  );

  const getActiveOfficers = React.useCallback(async () => {
    const { json } = await execute("/leo/active-officers", {
      noToast: true,
    });

    if (json && Array.isArray(json)) {
      handleState(json);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, handleState]);

  React.useEffect(() => {
    if (!ran) {
      getActiveOfficers();
      ran = true;
    }
  }, [getActiveOfficers]);

  useListener(SocketEvents.UpdateOfficerStatus, (data: Officer[] | null) => {
    if (data && Array.isArray(data)) {
      handleState(data);
      return;
    }

    getActiveOfficers();
  });

  return { activeOfficers, setActiveOfficers, state };
}
