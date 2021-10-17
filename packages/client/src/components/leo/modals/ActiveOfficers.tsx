import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";

export const ActiveOfficers = () => {
  const { isOpen, closeModal } = useModal();

  return (
    <Modal
      title={"Active Officers"}
      isOpen={isOpen(ModalIds.ActiveOfficers)}
      onClose={() => closeModal(ModalIds.ActiveOfficers)}
    >
      {null}
    </Modal>
  );
};
