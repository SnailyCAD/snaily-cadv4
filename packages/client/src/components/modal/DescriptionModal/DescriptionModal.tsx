import { Button } from "components/Button";
import { useModal } from "context/ModalContext";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { Modal } from "../Modal";
import { Editor } from "./Editor";

interface Props {
  title: string;
  description?: string;
  onClose?(): void;
}

export function DescriptionModal(props: Props) {
  const common = useTranslations("Common");
  const { closeModal, isOpen } = useModal();

  function handleClose() {
    props.onClose?.();
    closeModal(ModalIds.Description);
  }

  return (
    <Modal
      className="min-w-[600px]"
      title={props.title}
      onClose={handleClose}
      isOpen={isOpen(ModalIds.Description)}
    >
      <p className="my-3">{props.description}</p>
      <Editor />
      <div className="flex items-center justify-end gap-2 mt-2">
        <Button variant="cancel" onClick={handleClose}>
          {common("cancel")}
        </Button>
      </div>
    </Modal>
  );
}
