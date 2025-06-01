import type { Put911CallByIdData } from "@snailycad/types/api";
import type { LeafletEvent } from "leaflet";
import { convertToMap } from "lib/map/utils";
import useFetch from "lib/useFetch";
import * as React from "react";
import type { Full911Call } from "state/dispatch/active-dispatcher-state";
import { useCall911State } from "state/dispatch/call-911-state";
import { useMapStore } from "state/mapState";

export function useMarkerChange() {
  const map = useMapStore((state) => state.map);
  const { execute } = useFetch();
  const { calls, setCalls } = useCall911State((state) => ({
    calls: state.calls,
    setCalls: state.setCalls,
  }));

  const handleCallStateUpdate = React.useCallback(
    (callId: string, data: Full911Call) => {
      const prevIdx = calls.findIndex((v) => v.id === callId);
      if (prevIdx !== -1) {
        calls[prevIdx] = data;
      }

      setCalls(calls);
    },
    [calls], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleMoveEnd = React.useCallback(
    async (e: LeafletEvent, call: Full911Call) => {
      const latLng = e.target._latlng;
      const data = {
        ...call,
        gtaMapPosition: null,
        gtaMapPositionId: null,
        position: { id: call.positionId ?? "", ...latLng },
      };

      handleCallStateUpdate(call.id, data);

      const { json } = await execute<Put911CallByIdData>({
        path: `/911-calls/${call.id}`,
        method: "PUT",
        data: {
          gtaMapPosition: null,
          gtaMapPositionId: null,
          position: data.position,
        },
      });

      handleCallStateUpdate(call.id, { ...data, ...json });
    },
    [handleCallStateUpdate], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleMarkerChange = React.useCallback(
    async (call: Full911Call, type: "remove" | "set") => {
      if (!map) return;
      const index = calls.findIndex((v) => v.id === call.id);
      const coords = convertToMap(150 * index, 0, map);

      const callData =
        type === "set"
          ? { ...call, position: { ...coords, id: "null" } }
          : { ...call, position: null };

      handleCallStateUpdate(call.id, callData);

      const { json } = await execute<Put911CallByIdData>({
        path: `/911-calls/${call.id}`,
        method: "PUT",
        data: {
          position: callData.position,
        },
      });

      handleCallStateUpdate(call.id, { ...callData, ...json });
    },
    [handleCallStateUpdate, map, calls], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return {
    handleMarkerChange,
    handleMoveEnd,
  };
}
