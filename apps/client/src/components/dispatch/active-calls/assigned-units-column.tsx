import * as React from "react";
import type { AssignedUnit, CombinedLeoUnit, EmsFdDeputy, Officer } from "@snailycad/types";
import { isUnitCombined, isUnitCombinedEmsFd } from "@snailycad/utils";
import { Droppable, Draggable } from "@snailycad/ui";
import { useActiveDispatchers } from "hooks/realtime/use-active-dispatchers";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { makeUnitName } from "lib/utils";
import { useTranslations } from "next-intl";
import { Full911Call, useDispatchState } from "state/dispatch/dispatch-state";
import { DndActions } from "types/DndActions";
import { shallow } from "zustand/shallow";
import { classNames } from "lib/classNames";

interface Props {
  call: Full911Call;
  isDispatch: boolean;
  handleAssignToCall(call: Full911Call, unitId: string): void;
}

export function AssignedUnitsColumn({ handleAssignToCall, isDispatch, call }: Props) {
  const common = useTranslations("Common");
  const { generateCallsign } = useGenerateCallsign();
  const { setDraggingUnit, draggingUnit } = useDispatchState(
    (state) => ({
      draggingUnit: state.draggingUnit,
      setDraggingUnit: state.setDraggingUnit,
    }),
    shallow,
  );
  const { hasActiveDispatchers } = useActiveDispatchers();
  const canDrag = hasActiveDispatchers && isDispatch;
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (draggingUnit === "move" && scrollRef.current) {
      // horizontally scroll into the assigned units column view.
      // makes it easier to move the unit to the correct column
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [draggingUnit]);

  function makeAssignedUnit(unit: AssignedUnit) {
    if (!unit.unit) return "UNKNOWN";

    return isUnitCombined(unit.unit) || isUnitCombinedEmsFd(unit.unit)
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
      <div ref={scrollRef} className="flex">
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
                    <span
                      className={classNames(
                        canDrag
                          ? "!cursor-move hover:bg-secondary px-1.5 py-0.5 rounded-md"
                          : "cursor-default",
                      )}
                    >
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
