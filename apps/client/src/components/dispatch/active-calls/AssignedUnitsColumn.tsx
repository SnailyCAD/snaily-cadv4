import type { AssignedUnit, CombinedLeoUnit, EmsFdDeputy, Officer } from "@snailycad/types";
import { isUnitCombined } from "@snailycad/utils";
import { Draggable } from "components/shared/dnd/Draggable";
import { Droppable } from "components/shared/dnd/Droppable";
import { useActiveDispatchers } from "hooks/realtime/useActiveDispatchers";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { makeUnitName } from "lib/utils";
import { useTranslations } from "next-intl";
import { Full911Call, useDispatchState } from "state/dispatch/dispatch-state";
import { DndActions } from "types/DndActions";

interface Props {
  call: Full911Call;
  isDispatch: boolean;
  handleAssignToCall(call: Full911Call, unitId: string): void;
}

export function AssignedUnitsColumn({ handleAssignToCall, isDispatch, call }: Props) {
  const common = useTranslations("Common");
  const { generateCallsign } = useGenerateCallsign();
  const setDraggingUnit = useDispatchState((state) => state.setDraggingUnit);
  const { hasActiveDispatchers } = useActiveDispatchers();
  const canDrag = hasActiveDispatchers && isDispatch;

  function makeAssignedUnit(unit: AssignedUnit) {
    if (!unit.unit) return "UNKNOWN";

    return isUnitCombined(unit.unit)
      ? generateCallsign(unit.unit, "pairedUnitTemplate")
      : `${generateCallsign(unit.unit)} ${makeUnitName(unit.unit)}`;
  }

  return (
    <Droppable
      accepts={[DndActions.MoveUnitTo911CallOrIncident]}
      onDrop={(item: Officer | EmsFdDeputy | CombinedLeoUnit) =>
        void handleAssignToCall(call, item.id)
      }
      canDrop={(item) => isDispatch && !call.assignedUnits.some((v) => v.unit?.id === item.id)}
    >
      <div className="flex gap-2">
        {call.assignedUnits.length <= 0
          ? common("none")
          : call.assignedUnits.map((unit, idx) => (
              <Draggable
                canDrag={canDrag}
                onDrag={(isDragging) => {
                  setDraggingUnit(isDragging ? "call" : null);
                }}
                key={unit.id}
                item={{ call, unit }}
                type={DndActions.UnassignUnitFrom911Call}
              >
                {() => {
                  const comma = idx + 1 === call.assignedUnits.length ? "" : ", ";
                  return (
                    <span className={canDrag ? "!cursor-move" : "cursor-default"}>
                      {makeAssignedUnit(unit)}
                      {comma}
                    </span>
                  );
                }}
              </Draggable>
            ))}
      </div>
    </Droppable>
  );
}
