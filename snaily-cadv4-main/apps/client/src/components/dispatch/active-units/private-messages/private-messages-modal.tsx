import * as React from "react";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";
import { MessageItem } from "./message-item";
import { SendMessageForm } from "./send-message-form/send-message-form";
import type { DispatchChat } from "@snailycad/types";
import { useQuery } from "@tanstack/react-query";
import useFetch from "lib/useFetch";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { isUnitOfficer } from "@snailycad/utils";
import type { ActiveOfficer } from "state/leo-state";
import type { ActiveDeputy } from "state/ems-fd-state";
import { makeUnitName } from "lib/utils";
import { SocketEvents } from "@snailycad/config";
import { useListener } from "@casperiv/use-socket.io";

const fakeMessages = new Array(10).fill(0);

export function PrivateMessagesModal() {
  const modalState = useModal();
  const t = useTranslations("Leo");
  const unit = modalState.getPayload<ActiveOfficer | ActiveDeputy>(ModalIds.PrivateMessage);
  const [messages, setMessages] = React.useState<DispatchChat[]>([]);
  const endListItemRef = React.useRef<HTMLLIElement | null>(null);
  const { generateCallsign } = useGenerateCallsign();

  const { execute } = useFetch();
  const { isLoading } = useQuery({
    refetchOnMount: true,
    refetchOnReconnect: true,
    queryKey: ["private-messages", unit?.id],
    queryFn: async () => {
      if (!unit?.id) return [];

      const { json } = await execute<DispatchChat[]>({
        path: `/dispatch/private-message/${unit?.id}`,
        method: "GET",
      });

      const array = Array.isArray(json) ? json : [];
      setMessages(array);

      return array;
    },
  });

  function handleClose() {
    modalState.closeModal(ModalIds.PrivateMessage);
  }

  function handleSend(message: DispatchChat) {
    setMessages((prev) => {
      if (prev.some((v) => v.id === message.id)) return prev;
      return [...prev, message];
    });

    // scroll to the bottom
    endListItemRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  React.useEffect(() => {
    endListItemRef.current?.scrollIntoView();
  }, [messages]);

  useListener(
    SocketEvents.PrivateMessage,
    (data: { chat: DispatchChat; unitId: string }) => {
      if (data.unitId === unit?.id) {
        setMessages((prev) => {
          if (prev.some((v) => v.id === data.chat.id)) return prev;
          return [...prev, data.chat];
        });
      }
    },
    [unit?.id],
  );

  if (!unit?.id) {
    return null;
  }

  const templateId = isUnitOfficer(unit) ? "callsignTemplate" : "pairedUnitTemplate";
  const unitCallsign = generateCallsign(unit, templateId);
  const unitName = makeUnitName(unit);

  return (
    <Modal
      onClose={handleClose}
      isOpen={modalState.isOpen(ModalIds.PrivateMessage)}
      title={t("privateMessage")}
      className="w-[600px]"
    >
      <p className="dark:text-gray-400 text-neutral-700 mb-6 -mt-1">
        {unitCallsign} {unitName}
      </p>

      <ul className="overflow-auto h-[350px] flex flex-col gap-y-2">
        {isLoading ? (
          fakeMessages.map((_, idx) => (
            <li
              key={idx}
              className="dark:bg-secondary bg-gray-200/70 animate-pulse w-full h-6 my-1 rounded-md"
            />
          ))
        ) : messages.length <= 0 ? (
          <p className="mt-2">{t("noMessages")}</p>
        ) : (
          messages.map((event) => <MessageItem key={event.id} message={event} />)
        )}
        <li ref={endListItemRef} aria-hidden />
      </ul>

      <SendMessageForm onSend={handleSend} unitId={unit?.id} />
    </Modal>
  );
}
