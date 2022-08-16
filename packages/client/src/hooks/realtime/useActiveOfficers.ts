import * as React from "react";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import useFetch from "lib/useFetch";
import { useDispatchState } from "state/dispatch/dispatchState";
import { useAuth } from "context/AuthContext";
import { useLeoState } from "state/leoState";
import type { CombinedLeoUnit, Officer } from "@snailycad/types";
import { isUnitCombined } from "@snailycad/utils";
import type { GetActiveOfficersData } from "@snailycad/types/api";

let ran = false;
export function useActiveOfficers() {
  const { user } = useAuth();
  const { activeOfficers, setActiveOfficers } = useDispatchState();
  const { state, execute } = useFetch();
  const { setActiveOfficer } = useLeoState();

  const handleState = React.useCallback(
    (data: (Officer | CombinedLeoUnit)[]) => {
      setActiveOfficers(data);

      const activeOfficer = data.find((v) => {
        if (isUnitCombined(v)) {
          return v.officers.some((v) => v.userId === user?.id);
        }

        return v.userId === user?.id;
      });

      if (activeOfficer) {
        setActiveOfficer(activeOfficer);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id],
  );

  const getActiveOfficers = React.useCallback(async () => {
    const { json } = await execute<GetActiveOfficersData>({
      path: "/leo/active-officers",
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

  useListener(SocketEvents.UpdateOfficerStatus, (data: (Officer | CombinedLeoUnit)[] | null) => {
    if (data && Array.isArray(data)) {
      handleState(data);
      return;
    }

    getActiveOfficers();
  });

  return { activeOfficers, setActiveOfficers, state };
}
