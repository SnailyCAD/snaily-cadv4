import { Modal } from "components/modal/Modal";
import { toastMessage } from "lib/toastMessage";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { LoginForm } from "./login-form";

export function ReauthorizeSessionModal() {
  const modalState = useModal();

  function handleSubmit() {
    toastMessage({
      icon: "success",
      title: "Reauthorized",
      message: "You have been reauthorized. You can now continue to use SnailyCAD.",
    });

    modalState.closeModal(ModalIds.ReauthorizeSession);
  }

  return (
    <Modal
      className="w-[448px]"
      title="Reauthorize Session"
      onClose={() => modalState.closeModal(ModalIds.ReauthorizeSession)}
      isOpen={modalState.isOpen(ModalIds.ReauthorizeSession)}
    >
      <LoginForm isWithinModal onFormSubmitted={handleSubmit} />
    </Modal>
  );
}
