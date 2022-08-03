import * as React from "react";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import useFetch from "lib/useFetch";
import { useDispatchState } from "state/dispatchState";
import { useAuth } from "context/AuthContext";
import { useLeoState } from "state/leoState";
import type { CombinedLeoUnit, Officer } from "@snailycad/types";
import { isUnitOfficer } from "@snailycad/utils";
import type { GetActiveOfficersPaginatedData } from "@snailycad/types/api";

let ran = false;
export function useActiveOfficers() {
  const { user } = useAuth();
  const { activeOfficers, setActiveOfficerInMap } = useDispatchState();
  const { state, execute } = useFetch();
  const { setActiveOfficer } = useLeoState();

  const handleState = React.useCallback(
    (data: (Officer | CombinedLeoUnit)[]) => {
      for (const officer of data) {
        setActiveOfficerInMap(officer);
      }

      const activeOfficer = data.find((v) => {
        if (isUnitOfficer(v)) {
          return v.userId === user?.id;
        }

        return v.officers.some((v) => v.userId === user?.id);
      });

      if (activeOfficer) {
        setActiveOfficer(activeOfficer);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id],
  );

  const getActiveOfficers = React.useCallback(async () => {
    const { json } = await execute<GetActiveOfficersPaginatedData>({
      path: "/leo/active-officers",
      noToast: true,
      params: {
        includeAll: true,
      },
    });

    if (json.officers) {
      handleState(json.officers);
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

  return { activeOfficers, setActiveOfficerInMap, state };
}
