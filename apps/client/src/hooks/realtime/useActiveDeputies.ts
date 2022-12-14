import * as React from "react";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { useAuth } from "context/AuthContext";
import useFetch from "lib/useFetch";
import { useDispatchState } from "state/dispatch/dispatch-state";
import { useEmsFdState } from "state/ems-fd-state";
import type { EmsFdDeputy } from "@snailycad/types";
import type { GetEmsFdActiveDeputies } from "@snailycad/types/api";
import { useCall911State } from "state/dispatch/call-911-state";
import shallow from "zustand/shallow";

export function useActiveDeputies() {
  const { user } = useAuth();
  const { activeDeputies, setActiveDeputies } = useDispatchState();
  const { state, execute } = useFetch();
  const setActiveDeputy = useEmsFdState((state) => state.setActiveDeputy);
  const call911State = useCall911State(
    (state) => ({
      calls: state.calls,
      setCalls: state.setCalls,
    }),
    shallow,
  );

  const handleCallsState = React.useCallback(
    (data: EmsFdDeputy[]) => {
      const updatedCalls = [...call911State.calls].map((call) => {
        const newAssignedUnits = [...call.assignedUnits].map((assignedUnit) => {
          const deputy = data.find((v) => v.id === assignedUnit.emsFdDeputyId);

          if (deputy) {
            return { ...assignedUnit, unit: deputy };
          }

          return assignedUnit;
        });

        call.assignedUnits = newAssignedUnits;

        return call;
      });

      call911State.setCalls(updatedCalls);
    },
    [call911State.calls], // eslint-disable-line react-hooks/exhaustive-deps
  );

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
      handleCallsState(data);
      return;
    }

    getActiveDeputies();
  });

  return { activeDeputies, setActiveDeputies, state };
}
