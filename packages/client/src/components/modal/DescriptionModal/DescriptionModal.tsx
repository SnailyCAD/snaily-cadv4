import * as React from "react";
import { Button } from "components/Button";
import { useModal } from "state/modalState";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { Modal } from "../Modal";
import { DEFAULT_EDITOR_DATA, Editor } from "./Editor";
import type { Descendant } from "slate";
import type { JsonArray } from "type-fest";

interface Props {
  value?: Descendant[] | JsonArray | null;
  onClose?(): void;
}

export function DescriptionModal(props: Props) {
  const [value, setValue] = React.useState<Descendant[] | JsonArray>(
    props.value ?? DEFAULT_EDITOR_DATA,
  );
  const common = useTranslations("Common");
  const { closeModal, isOpen } = useModal();

  function handleClose() {
    props.onClose?.();
    closeModal(ModalIds.Description);
  }

  React.useEffect(() => {
    setValue(props.value ?? DEFAULT_EDITOR_DATA);
  }, [props.value]);

  return (
    <Modal
      className="min-w-[600px] max-w-[750px]"
      title={common("description")}
      onClose={handleClose}
      isOpen={isOpen(ModalIds.Description)}
    >
      <Editor isReadonly value={value} onChange={setValue} />
      <div className="flex items-center justify-end gap-2 mt-2">
        <Button onClick={handleClose}>{common("cancel")}</Button>
      </div>
    </Modal>
  );
}
