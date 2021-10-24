import { useTranslations } from "use-intl";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { Full911Call, useDispatchState } from "state/dispatchState";
import format from "date-fns/format";
import compareDesc from "date-fns/compareDesc";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";

interface Props {
  call: Full911Call | null;
  onClose?: () => void;
}

export const CallEventsModal = ({ call, onClose }: Props) => {
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
      className="min-w-[500px]"
    >
      <ul className="overflow-auto h-[250px]">
        {(call?.events.length ?? 0) <= 0 ? (
          <p className="mt-2">{t("noEvents")}</p>
        ) : (
          call?.events
            .sort((a, b) => compareDesc(new Date(a.createdAt), new Date(b.createdAt)))
            .map((event) => {
              const formatted = format(new Date(event.createdAt), "HH:mm:ss");

              return (
                <li key={event.id}>
                  <span className="select-none text-gray-800 mr-1 font-semibold">{formatted}:</span>
                  <span>{event.description}</span>
                </li>
              );
            })
        )}
      </ul>
    </Modal>
  );
};
