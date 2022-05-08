import * as React from "react";
import type { Call911Event, IncidentEvent } from "@snailycad/types";
import { useModal } from "state/modalState";
import { useHoverDirty } from "react-use";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { FullDate } from "components/shared/FullDate";
import { classNames } from "lib/classNames";
import { Button } from "components/Button";
import { Pencil, X } from "react-bootstrap-icons";
import { AlertModal } from "components/modal/AlertModal";

interface EventItemProps<T extends IncidentEvent | Call911Event> {
  disabled?: boolean;
  event: T;
  setTempEvent: React.Dispatch<React.SetStateAction<T | null>>;
  isEditing: boolean;
}

export function EventItem<T extends IncidentEvent | Call911Event>({
  disabled,
  event,
  isEditing,
  setTempEvent,
}: EventItemProps<T>) {
  const { openModal, closeModal } = useModal();
  const actionsRef = React.useRef<HTMLLIElement>(null);
  const isHovering = useHoverDirty(actionsRef);
  const t = useTranslations("Calls");
  const { execute } = useFetch();
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

    await execute(`/${routeType}/events/${parentId}/${event.id}`, {
      method: "DELETE",
    });

    setTempEvent(null);
    handleClose();
  }

  return (
    <li
      ref={actionsRef}
      className={classNames(
        "flex justify-between dark:hover:bg-dark-bright hover:bg-gray-200/70 rounded-md px-1.5",
        isEditing && "dark:bg-dark-bright bg-gray-200/70",
      )}
    >
      <div>
        <span className="select-none text-gray-800 dark:text-gray-400 mr-1 font-semibold w-[90%]">
          <FullDate>{event.createdAt}</FullDate>:
        </span>
        <span>{event.description}</span>
      </div>

      {disabled ? null : (
        <div className={classNames(isHovering ? "flex" : "hidden")}>
          <Button
            className="p-0 px-1 mr-2"
            small
            variant="cancel"
            onClick={() => setTempEvent(event)}
          >
            <Pencil width={15} />
          </Button>
          <Button className="p-0 px-1" small variant="cancel" onClick={handleOpen}>
            <X width={20} height={20} />
          </Button>
        </div>
      )}

      {open && !disabled ? (
        <AlertModal
          description={t("alert_deleteCallEvent")}
          onDeleteClick={deleteEvent}
          title={t("deleteCallEvent")}
          id={ModalIds.AlertDeleteCallEvent}
        />
      ) : null}
    </li>
  );
}
