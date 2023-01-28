import { useImageUrl } from "hooks/useImageUrl";
import { ContextMenu } from "components/shared/ContextMenu";
import { useValues } from "context/ValuesContext";
import { useUnitStatusChange } from "hooks/shared/useUnitsStatusChange";
import { Draggable } from "components/shared/dnd/Draggable";
import { DndActions } from "types/DndActions";
import { ActiveUnitsQualificationsCard } from "components/leo/qualifications/ActiveUnitsQualificationsCard";
import { useActiveDeputies } from "hooks/realtime/useActiveDeputies";
import { useActiveDispatchers } from "hooks/realtime/use-active-dispatchers";
import type { CombinedEmsFdUnit, EmsFdDeputy } from "@snailycad/types";
import Image from "next/image";
import { useDispatchState } from "state/dispatch/dispatch-state";
import { isUnitCombinedEmsFd } from "@snailycad/utils";

interface Props {
  isDispatch: boolean;
  nameAndCallsign: string;
  deputy: EmsFdDeputy | CombinedEmsFdUnit;
}

export function DeputyColumn({ deputy, isDispatch, nameAndCallsign }: Props) {
  const { activeDeputies, setActiveDeputies } = useActiveDeputies();
  const { hasActiveDispatchers } = useActiveDispatchers();

  const { setStatus } = useUnitStatusChange({ setUnits: setActiveDeputies, units: activeDeputies });
  const { makeImageUrl } = useImageUrl();
  const { codes10 } = useValues();
  const setDraggingUnit = useDispatchState((state) => state.setDraggingUnit);

  const codesMapped = codes10.values
    .filter((v) => v.type === "STATUS_CODE")
    .map((v) => ({
      name: v.value.value,
      onClick: () => setStatus(deputy.id, v),
      "aria-label": `Set status to ${v.value.value}`,
      title: `Set status to ${v.value.value}`,
    }));

  return (
    <ContextMenu canBeOpened={isDispatch && hasActiveDispatchers} asChild items={codesMapped}>
      <span>
        <Draggable
          onDrag={(isDragging) => setDraggingUnit(isDragging ? "move" : null)}
          canDrag={hasActiveDispatchers && isDispatch}
          item={deputy}
          type={DndActions.MoveUnitTo911CallOrIncident}
        >
          {({ isDragging }) => (
            <ActiveUnitsQualificationsCard canBeOpened={!isDragging} unit={deputy}>
              <span // * 9 to fix overlapping issues with next table column
                style={{ minWidth: nameAndCallsign.length * 9 }}
                className="capitalize cursor-default"
              >
                {!isUnitCombinedEmsFd(deputy) && deputy.imageId ? (
                  <Image
                    className="rounded-md w-[30px] h-[30px] object-cover mr-2 inline-block"
                    draggable={false}
                    src={makeImageUrl("units", deputy.imageId)!}
                    loading="lazy"
                    width={30}
                    height={30}
                    alt={nameAndCallsign}
                  />
                ) : null}
                {nameAndCallsign}
              </span>
            </ActiveUnitsQualificationsCard>
          )}
        </Draggable>
      </span>
    </ContextMenu>
  );
}
