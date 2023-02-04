import * as React from "react";
import type {
  AssignedUnit,
  Call911Event,
  IncidentEvent,
  LeoIncident,
  StatusValue,
} from "@snailycad/types";
import { useModal } from "state/modalState";
import { useHoverDirty } from "react-use";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { FullDate } from "components/shared/FullDate";
import { classNames } from "lib/classNames";
import { Button } from "@snailycad/ui";
import { Pencil, X } from "react-bootstrap-icons";
import { AlertModal } from "components/modal/AlertModal";
import type { Delete911CallEventByIdData, DeleteIncidentEventByIdData } from "@snailycad/types/api";
import type { Full911Call } from "state/dispatch/dispatch-state";
import { makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";

interface EventItemProps<T extends IncidentEvent | Call911Event> {
  disabled?: boolean;
  event: T;
  setTempEvent: React.Dispatch<React.SetStateAction<T["id"] | null>>;
  isEditing: boolean;

  onEventDelete?(incident: T extends IncidentEvent ? LeoIncident : Full911Call): void;
}

export function EventItem<T extends IncidentEvent | Call911Event>({
  disabled,
  event,
  isEditing,
  setTempEvent,
  onEventDelete,
}: EventItemProps<T>) {
  const [isEditable, setIsEditable] = React.useState(!disabled);

  const { openModal, closeModal } = useModal();
  const actionsRef = React.useRef<HTMLLIElement>(null);
  const isHovering = useHoverDirty(actionsRef);
  const t = useTranslations("Calls");
  const tEvent = useTranslations("Events");
  const { execute } = useFetch();
  const { generateCallsign } = useGenerateCallsign();
  const [open, setOpen] = React.useState(false);

  function handleOpen() {
    setOpen(true);
    openModal(ModalIds.AlertDeleteCallEvent);
  }

  function handleClose() {
    setOpen(false);
    closeModal(ModalIds.AlertDeleteCallEvent);
  }

  async function deleteEvent() {
    if (disabled) return;
    const parentId = "call911Id" in event ? event.call911Id : event.incidentId;
    const routeType = "call911Id" in event ? "911-calls" : "incidents";

    const { json } = await execute<DeleteIncidentEventByIdData | Delete911CallEventByIdData>({
      path: `/${routeType}/events/${parentId}/${event.id}`,
      method: "DELETE",
    });

    if (json) {
      setTempEvent(null);
      setOpen(false);
      handleClose();

      if (typeof json === "object") {
        // @ts-expect-error ignore
        onEventDelete?.(json);
      }
    }
  }

  const eventDescription = React.useMemo(() => {
    const translationData = "translationData" in event && (event.translationData as any);

    if (translationData && event.description && translationData?.units) {
      const units = translationData.units as AssignedUnit[];

      setIsEditable(false);

      return tEvent.rich(event.description, {
        unit: units
          .map((unit) =>
            unit.unit ? `${generateCallsign(unit.unit)} ${makeUnitName(unit.unit)}` : "A unit",
          )
          .join(", "),
      });
    }

    if (translationData && event.description && translationData?.unit) {
      const unit = translationData.unit as NonNullable<AssignedUnit["unit"]>;
      const situationCode = translationData.status as StatusValue;

      setIsEditable(false);

      return tEvent.rich(event.description, {
        unit: `${generateCallsign(unit)} ${makeUnitName(unit)}`,
        situationCode: situationCode.value.value,
      });
    }

    return event.description;
  }, [event]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <li
      ref={actionsRef}
      className={classNames(
        "flex justify-between dark:hover:bg-secondary hover:bg-gray-200/70 rounded-md px-1.5",
        (isEditing || open) && "dark:bg-secondary bg-gray-200/70",
      )}
    >
      <div>
        <span className="select-none text-gray-700 dark:text-gray-400 mr-1 font-semibold w-[90%]">
          <FullDate>{event.createdAt}</FullDate>:
        </span>
        <span>{eventDescription}</span>
      </div>

      {isEditable ? (
        <div className={classNames(isHovering || open || isEditing ? "flex" : "hidden")}>
          <Button
            className="p-0 px-1 mr-2"
            size="xs"
            variant="cancel"
            onPress={() => setTempEvent(event.id)}
          >
            <Pencil width={15} />
          </Button>
          <Button className="p-0 px-1" size="xs" variant="cancel" onPress={handleOpen}>
            <X width={20} height={20} />
          </Button>
        </div>
      ) : null}

      {open && isEditable ? (
        <AlertModal
          description={t("alert_deleteCallEvent")}
          onDeleteClick={deleteEvent}
          title={t("deleteCallEvent")}
          id={ModalIds.AlertDeleteCallEvent}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </li>
  );
}
