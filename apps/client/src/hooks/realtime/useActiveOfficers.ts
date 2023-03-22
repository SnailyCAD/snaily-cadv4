import * as React from "react";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import useFetch from "lib/useFetch";
import { useDispatchState } from "state/dispatch/dispatch-state";
import { useAuth } from "context/AuthContext";
import { useLeoState } from "state/leo-state";
import type { CombinedLeoUnit, Officer } from "@snailycad/types";
import { isUnitCombined, isUnitOfficer } from "@snailycad/utils";
import type { GetActiveOfficersData } from "@snailycad/types/api";
import { useCall911State } from "state/dispatch/call-911-state";
import { shallow } from "zustand/shallow";
import { useMapPlayersStore } from "./use-map-players";
import { useActiveIncidents } from "./useActiveIncidents";

let ran = false;
export function useActiveOfficers() {
  const { user } = useAuth();
  const { activeOfficers, setActiveOfficers } = useDispatchState();
  const { state, execute } = useFetch();
  const setActiveOfficer = useLeoState((state) => state.setActiveOfficer);
  const playerState = useMapPlayersStore();
  const incidentsState = useActiveIncidents();

  const call911State = useCall911State(
    (state) => ({
      calls: state.calls,
      setCalls: state.setCalls,
    }),
    shallow,
  );

  // remove the unit property from the player state
  const handleMapPlayersState = React.useCallback(
    (unitId: string) => {
      const players = Array.from(playerState.players.values());
      const player = players.find((player) => "unit" in player && player.unit?.id === unitId);

      if (player) {
        const newPlayers = playerState.players;

        newPlayers.set(player.identifier, { ...player, unit: null });
        playerState.setPlayers(newPlayers);
      }
    },
    [playerState],
  );

  const handleIncidentsState = React.useCallback(
    (data: (Officer | CombinedLeoUnit)[]) => {
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
    (data: (Officer | CombinedLeoUnit)[]) => {
      const updatedCalls = [...call911State.calls].map((call) => {
        const newAssignedUnits = [...call.assignedUnits].map((assignedUnit) => {
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

        call.assignedUnits = newAssignedUnits;

        return call;
      });

      call911State.setCalls(updatedCalls);
    },
    [call911State.calls], // eslint-disable-line react-hooks/exhaustive-deps
  );

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

      // update the player state with the unit
      const players = Array.from(playerState.players.values());
      const newPlayers = playerState.players;

      for (const player of players) {
        const officer = data.find(
          (officer) =>
            (isUnitOfficer(officer) &&
              officer.user &&
              officer.user.steamId === player.convertedSteamId) ||
            (isUnitOfficer(officer) && officer.user && officer.user.discordId === player.discordId),
        );

        if (officer && isUnitOfficer(officer)) {
          newPlayers.set(player.identifier, { ...player, unit: officer });
        }
      }

      playerState.setPlayers(newPlayers);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.id, playerState.players],
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

  useListener(SocketEvents.SetUnitOffDuty, (unitId: string) => {
    handleMapPlayersState(unitId);
  });

  useListener(SocketEvents.UpdateOfficerStatus, (data: (Officer | CombinedLeoUnit)[] | null) => {
    if (data && Array.isArray(data)) {
      handleState(data);
      handleCallsState(data);
      handleIncidentsState(data);
      return;
    }

    getActiveOfficers();
  });

  return { activeOfficers, setActiveOfficers, state };
}
