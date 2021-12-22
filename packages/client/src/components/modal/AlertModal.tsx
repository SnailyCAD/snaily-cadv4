import { Button } from "components/Button";
import { Loader } from "components/Loader";
import { useModal } from "context/ModalContext";
import { useTranslations } from "use-intl";
import { Modal, ModalProps } from "./Modal";

type Props = Pick<ModalProps, "title" | "className"> & {
  id: string;
  description: string | React.ReactFragment;
  state?: any;
  onDeleteClick: () => void;
  onClose?(): void;

  deleteText?: string;
};

export const AlertModal = (props: Props) => {
  const common = useTranslations("Common");
  const { closeModal, isOpen } = useModal();

  function handleClose() {
    props.onClose?.();
    closeModal(props.id);
  }

  return (
    <Modal
      className={`w-[550px] ${props.className}`}
      title={props.title}
      onClose={handleClose}
      isOpen={isOpen(props.id)}
    >
      <p className="my-3">{props.description}</p>
      <div className="mt-2 flex gap-2 items-center justify-end">
        <Button variant="cancel" disabled={props.state === "loading"} onClick={handleClose}>
          {common("cancel")}
        </Button>
        <Button
          disabled={props.state === "loading"}
          variant="danger"
          className="flex items-center"
          onClick={props.onDeleteClick}
        >
          {props.state === "loading" ? <Loader className="border-red-200 mr-2" /> : null}{" "}
          {props.deleteText ? props.deleteText : common("delete")}
        </Button>
      </div>
    </Modal>
  );
};
