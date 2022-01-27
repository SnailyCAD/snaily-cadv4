import { useTranslations } from "use-intl";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { Full911Call, useDispatchState } from "state/dispatchState";
import compareDesc from "date-fns/compareDesc";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { FullDate } from "components/shared/FullDate";

interface Props {
  call: Full911Call | null;
  onClose?(): void;
}

export function CallEventsModal({ call, onClose }: Props) {
  const { isOpen, closeModal } = useModal();
  const t = useTranslations("Calls");
  const { setCalls, calls } = useDispatchState();

  useListener(
    SocketEvents.AddCallEvent,
    (event) => {
      if (!call) return;

      call.events.push(event);

      setCalls(
        calls.map((c) => {
          if (c.id === call.id) {
            return { ...c, events: [event, ...c.events] };
          }

          return c;
        }),
      );
    },
    [call, calls, setCalls],
  );

  function handleClose() {
    onClose?.();
    closeModal(ModalIds.Manage911Call);
  }

  return (
    <Modal
      isOpen={isOpen(ModalIds.Manage911Call)}
      onClose={handleClose}
      title={t("callEvents")}
      className="w-[500px]"
    >
      <ul className="overflow-auto h-[250px]">
        {(call?.events.length ?? 0) <= 0 ? (
          <p className="mt-2">{t("noEvents")}</p>
        ) : (
          call?.events
            .sort((a, b) => compareDesc(new Date(a.createdAt), new Date(b.createdAt)))
            .map((event) => {
              return (
                <li key={event.id}>
                  <span className="mr-1 font-semibold text-gray-800 select-none dark:text-gray-400">
                    <FullDate>{event.createdAt}</FullDate>:
                  </span>
                  <span>{event.description}</span>
                </li>
              );
            })
        )}
      </ul>
    </Modal>
  );
}
