import type { AssignedUnit, CombinedLeoUnit, EmsFdDeputy, Officer } from "@snailycad/types";
import { isUnitCombined } from "@snailycad/utils";
import { Draggable } from "components/shared/dnd/Draggable";
import { Droppable } from "components/shared/dnd/Droppable";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { makeUnitName } from "lib/utils";
import { useTranslations } from "next-intl";
import { Full911Call, useDispatchState } from "state/dispatchState";
import { DndActions } from "types/DndActions";

interface Props {
  call: Full911Call;
  isDispatch: boolean;
  handleAssignToCall: any;
}

export function AssignedUnitsColumn({ handleAssignToCall, isDispatch, call }: Props) {
  const common = useTranslations("Common");
  const { generateCallsign } = useGenerateCallsign();
  const dispatchState = useDispatchState();

  function makeAssignedUnit(unit: AssignedUnit) {
    return isUnitCombined(unit.unit)
      ? generateCallsign(unit.unit, "pairedUnitTemplate")
      : `${generateCallsign(unit.unit)} ${makeUnitName(unit.unit)}`;
  }

  return (
    <Droppable
      accepts={[DndActions.MoveUnitTo911Call]}
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
                canDrag={isDispatch}
                onDrag={(isDragging) => {
                  dispatchState.setIsDraggingUnit(isDragging);
                }}
                key={unit.id}
                item={{ call, unit }}
                type={DndActions.UnassignUnitFrom911Call}
              >
                {() => {
                  const comma = idx + 1 === call.assignedUnits.length ? "" : ", ";
                  return (
                    <p className={isDispatch ? "!cursor-move" : "cursor-default"}>
                      {makeAssignedUnit(unit)}
                      {comma}
                    </p>
                  );
                }}
              </Draggable>
            ))}
      </div>
    </Droppable>
  );
}
