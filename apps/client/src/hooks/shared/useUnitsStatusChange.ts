import * as React from "react";
import { StatusValue, StatusValueType, ShouldDoType } from "@snailycad/types";
import useFetch from "lib/useFetch";
import type { PutDispatchStatusByUnitId } from "@snailycad/types/api";

interface UnitStatusChangeArgs {
  units: any[];
  setUnits(units: any[]): void;
}

export function useUnitStatusChange(options?: UnitStatusChangeArgs) {
  const { state, execute } = useFetch();

  const setStatus = React.useCallback(
    async (unitId: string, status: StatusValue) => {
      if (status.type === StatusValueType.SITUATION_CODE) return null;

      if (options) {
        if (status.shouldDo === ShouldDoType.SET_OFF_DUTY) {
          options.setUnits(options.units.filter((v) => v.id !== unitId));
        } else {
          options.setUnits(
            options.units.map((unit) => {
              if (unit.id === unitId) {
                return { ...unit, statusId: status.id, status };
              }
              return unit;
            }),
          );
        }
      }

      const { json } = await execute<PutDispatchStatusByUnitId>({
        path: `/dispatch/status/${unitId}`,
        method: "PUT",
        data: { status: status.id },
      });

      return json;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options],
  );

  return {
    state,
    setStatus,
  };
}
