import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { MessageItem } from "./message-item";
import { SendMessageForm } from "./send-message-form";
import { DispatchChat } from "@snailycad/types";
import { useQuery } from "@tanstack/react-query";
import useFetch from "lib/useFetch";

const fakeMessages = new Array(10).fill(0);

export function PrivateMessagesModal() {
  const { isOpen, closeModal, getPayload } = useModal();
  const t = useTranslations("Leo");
  const unitId = getPayload<string>(ModalIds.PrivateMessage);

  const { execute } = useFetch();
  const { data, isLoading } = useQuery({
    queryKey: ["private-messages", unitId],
    queryFn: async () => {
      if (!unitId) return [];

      const { json } = await execute<DispatchChat[]>({
        path: `/dispatch/private-message/${unitId}`,
        method: "GET",
      });

      return Array.isArray(json) ? json : [];
    },
  });

  function handleClose() {
    closeModal(ModalIds.PrivateMessage);
  }

  if (!unitId) {
    return null;
  }

  return (
    <Modal
      onClose={handleClose}
      isOpen={isOpen(ModalIds.PrivateMessage)}
      title={t("privateMessage")}
      className="w-[600px]"
    >
      <ul className="overflow-auto h-[350px] flex flex-col gap-y-4">
        {isLoading ? (
          fakeMessages.map((_, idx) => (
            <li
              key={idx}
              className="dark:bg-secondary bg-gray-200/70 animate-pulse w-full h-6 my-1 rounded-md"
            />
          ))
        ) : (data?.length ?? 0) <= 0 ? (
          <p className="mt-2">{t("noMessages")}</p>
        ) : (
          data?.map((event) => <MessageItem key={event.id} message={event} />)
        )}
      </ul>

      <SendMessageForm unitId={unitId} />
    </Modal>
  );
}
