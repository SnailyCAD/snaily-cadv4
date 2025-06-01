import * as React from "react";
import { Loader, Button } from "@snailycad/ui";
import { classNames } from "lib/classNames";
import { useModal } from "state/modalState";
import { useTranslations } from "use-intl";
import { Modal, type ModalProps } from "./Modal";
import type { ModalIds } from "types/modal-ids";

type Props = Pick<ModalProps, "title" | "className"> & {
  id: ModalIds;
  description: React.ReactNode;
  state?: "error" | "loading" | null;
  onDeleteClick(): void;
  onClose?(): void;

  forceOpen?: boolean;
  deleteText?: string;
};

export function AlertModal(props: Props) {
  const common = useTranslations("Common");
  const modalState = useModal();

  function handleClose() {
    props.onClose?.();
    modalState.closeModal(props.id);
  }

  return (
    <Modal
      className={classNames("w-[550px]", props.className)}
      title={props.title}
      onClose={handleClose}
      isOpen={props.forceOpen ?? modalState.isOpen(props.id)}
      isAlert
    >
      <div className="my-3 dark:text-gray-300">{props.description}</div>
      <div className="flex items-center justify-end gap-2 mt-2">
        <Button variant="cancel" disabled={props.state === "loading"} onPress={handleClose}>
          {common("cancel")}
        </Button>
        <Button
          disabled={props.state === "loading"}
          variant="danger"
          className="flex items-center"
          onPress={props.onDeleteClick}
        >
          {props.state === "loading" ? <Loader className="mr-2 border-red-200" /> : null}{" "}
          {props.deleteText ? props.deleteText : common("delete")}
        </Button>
      </div>
    </Modal>
  );
}
