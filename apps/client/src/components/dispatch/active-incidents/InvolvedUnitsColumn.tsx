import type {
  CombinedLeoUnit,
  EmsFdDeputy,
  IncidentInvolvedUnit,
  LeoIncident,
  Officer,
} from "@snailycad/types";
import { isUnitCombined } from "@snailycad/utils";
import { Droppable, Draggable } from "@snailycad/ui";
import { useActiveDispatchers } from "hooks/realtime/use-active-dispatchers";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { classNames } from "lib/classNames";
import { makeUnitName } from "lib/utils";
import { useTranslations } from "next-intl";
import { useDispatchState } from "state/dispatch/dispatch-state";
import { DndActions } from "types/DndActions";

interface Props {
  incident: LeoIncident;
  handleAssignUnassignToIncident(
    incident: LeoIncident,
    unitId: string,
    type: "assign" | "unassign",
  ): Promise<void>;
}

export function InvolvedUnitsColumn({ handleAssignUnassignToIncident, incident }: Props) {
  const common = useTranslations("Common");
  const setDraggingUnit = useDispatchState((state) => state.setDraggingUnit);

  const { generateCallsign } = useGenerateCallsign();
  const { hasActiveDispatchers } = useActiveDispatchers();

  const canDrag = hasActiveDispatchers;

  function makeAssignedUnit(unit: IncidentInvolvedUnit) {
    if (!unit.unit) return "UNKNOWN";

    return isUnitCombined(unit.unit)
      ? generateCallsign(unit.unit, "pairedUnitTemplate")
      : `${generateCallsign(unit.unit)} ${makeUnitName(unit.unit)}`;
  }

  return (
    <Droppable
      accepts={[DndActions.MoveUnitTo911CallOrIncident]}
      onDrop={(item: Officer | EmsFdDeputy | CombinedLeoUnit) =>
        void handleAssignUnassignToIncident(incident, item.id, "assign")
      }
      canDrop={(item) => !incident.unitsInvolved.some((v) => v.unit?.id === item.id)}
    >
      <div className="flex gap-2">
        {incident.unitsInvolved.length <= 0
          ? common("none")
          : incident.unitsInvolved.map((unit, idx) => (
              <Draggable
                canDrag={canDrag}
                onDrag={(isDragging) => {
                  setDraggingUnit(isDragging ? "incident" : null);
                }}
                key={unit.id}
                item={{ incident, unit }}
                type={DndActions.UnassignUnitFromIncident}
              >
                {() => {
                  const comma = idx + 1 === incident.unitsInvolved.length ? "" : ", ";
                  return (
                    <span
                      className={classNames(
                        "text-base",
                        canDrag ? "!cursor-move" : "cursor-default",
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
