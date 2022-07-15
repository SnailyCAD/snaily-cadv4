import { Modal } from "components/modal/Modal";
import { toastMessage } from "lib/toastMessage";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { LoginForm } from "./LoginForm";

export function ReauthorizeSessionModal() {
  const { isOpen, closeModal } = useModal();

  function handleSubmit() {
    toastMessage({
      icon: "success",
      title: "Reauthorized",
      message: "You have been reauthorized. You can now continue to use SnailyCAD.",
    });

    closeModal(ModalIds.ReauthorizeSession);
  }

  return (
    <Modal
      className="w-[448px]"
      title="Reauthorize Session"
      onClose={() => closeModal(ModalIds.ReauthorizeSession)}
      isOpen={isOpen(ModalIds.ReauthorizeSession)}
    >
      <LoginForm isWithinModal onFormSubmitted={handleSubmit} />
    </Modal>
  );
}
