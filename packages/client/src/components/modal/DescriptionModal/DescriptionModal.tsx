import * as React from "react";
import { Button } from "components/Button";
import { useModal } from "context/ModalContext";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { Modal } from "../Modal";
import { DEFAULT_EDITOR_DATA, Editor } from "./Editor";
import { Descendant } from "slate";

interface Props {
  value?: Descendant[];
  isReadonly?: boolean;
  onClose?(): void;
  onSave?(data: Descendant[]): Promise<void>;
}

export function DescriptionModal(props: Props) {
  const [value, setValue] = React.useState<Descendant[]>(props.value ?? DEFAULT_EDITOR_DATA);
  const common = useTranslations("Common");
  const { closeModal, isOpen } = useModal();

  function handleClose() {
    props.onClose?.();
    closeModal(ModalIds.Description);
  }

  function handleSave() {
    if (props.isReadonly) return;
    closeModal(ModalIds.Description);
    props.onSave?.(value);
  }

  return (
    <Modal
      className="min-w-[600px]"
      title={common("description")}
      onClose={handleClose}
      isOpen={isOpen(ModalIds.Description)}
    >
      <Editor isReadonly={props.isReadonly} value={value} onChange={setValue} />
      <div className="flex items-center justify-end gap-2 mt-2">
        <Button variant="cancel" onClick={handleClose}>
          {common("cancel")}
        </Button>
        <Button disabled={props.isReadonly} onClick={handleSave}>
          {common("save")}
        </Button>
      </div>
    </Modal>
  );
}
