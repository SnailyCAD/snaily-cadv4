import * as React from "react";
import { useListener } from "@casperiv/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { useAuth } from "context/AuthContext";
import useFetch from "lib/useFetch";
import { useDispatchState } from "state/dispatch/dispatch-state";
import { useEmsFdState } from "state/ems-fd-state";
import type { CombinedEmsFdUnit, EmsFdDeputy } from "@snailycad/types";
import type { GetEmsFdActiveDeputies } from "@snailycad/types/api";
import { useCall911State } from "state/dispatch/call-911-state";
import { isUnitCombinedEmsFd } from "@snailycad/utils";
import { useActiveIncidents } from "./useActiveIncidents";
import { useMapPlayersStore } from "./use-map-players";
import { findPlayerFromUnit } from "lib/map/create-map-units-from-active-units.ts";
import { useQuery } from "@tanstack/react-query";

export function useActiveDeputies() {
  const { user } = useAuth();
  const { activeDeputies, setActiveDeputies } = useDispatchState((state) => ({
    activeDeputies: state.activeDeputies,
    setActiveDeputies: state.setActiveDeputies,
  }));
  const { state, execute } = useFetch();
  const setActiveDeputy = useEmsFdState((state) => state.setActiveDeputy);
  const playerState = useMapPlayersStore();

  const incidentsState = useActiveIncidents();
  const call911State = useCall911State((state) => ({
    calls: state.calls,
    setCalls: state.setCalls,
  }));

  const handleIncidentsState = React.useCallback(
    (data: EmsFdDeputy[]) => {
      const updatedIncidents = [...incidentsState.activeIncidents].map((incident) => {
        const newUnitsInvolved = [...incident.unitsInvolved].map((assignedUnit) => {
          const unitIds = [assignedUnit.officerId, assignedUnit.combinedLeoId];
          const officer = data.find((v) => unitIds.includes(v.id));

          if (officer) {
            return {
              ...assignedUnit,
              unit: officer,
            };
          }

          return assignedUnit;
        });

        incident.unitsInvolved = newUnitsInvolved;

        return incident;
      });

      incidentsState.setActiveIncidents(updatedIncidents);
    },
    [incidentsState.activeIncidents], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleCallsState = React.useCallback(
    (data: EmsFdDeputy[]) => {
      const updatedCalls = [...call911State.calls].map((call) => {
        const newAssignedUnits = [...call.assignedUnits].map((assignedUnit) => {
          const unitIds = [assignedUnit.emsFdDeputyId, assignedUnit.combinedEmsFdId];
          const deputy = data.find((v) => unitIds.includes(v.id));

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
    (activeDeputiesData: (EmsFdDeputy | CombinedEmsFdUnit)[]) => {
      setActiveDeputies(activeDeputiesData);

      const activeDeputy = activeDeputiesData.find((v) => {
        if (isUnitCombinedEmsFd(v)) {
          return v.deputies.some((v) => v.userId === user?.id);
        }

        return v.userId === user?.id;
      });

      if (activeDeputy) {
        setActiveDeputy(activeDeputy);
      }

      // update the player state with the unit
      const players = Array.from(playerState.players.values());
      const newPlayers = playerState.players;

      for (const player of players) {
        const deputy = activeDeputiesData.find((deputy) => findPlayerFromUnit(player, deputy));
        if (deputy) {
          newPlayers.set(player.identifier, { ...player, unit: deputy });
        }
      }

      playerState.setPlayers(newPlayers);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id],
  );

  const query = useQuery({
    queryKey: ["ems-fd-active-deputies"],
    queryFn: async () => {
      const { json } = await execute<GetEmsFdActiveDeputies>({
        path: "/ems-fd/active-deputies",
        noToast: true,
      });

      if (json && Array.isArray(json)) {
        handleState(json);
        return json;
      }

      return [];
    },
  });

  useListener(SocketEvents.UpdateEmsFdStatus, (data: EmsFdDeputy[] | null) => {
    if (data && Array.isArray(data)) {
      handleState(data);
      handleCallsState(data);
      handleIncidentsState(data);
    } else {
      query.refetch();
    }
  });

  return { activeDeputies, setActiveDeputies, state };
}
