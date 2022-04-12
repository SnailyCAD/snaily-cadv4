import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { useNotepad } from "hooks/shared/useNotepad";
import { ModalIds } from "types/ModalIds";
import { DEFAULT_EDITOR_DATA, Editor } from "components/modal/DescriptionModal/Editor";

export function NotepadModal() {
  const { isOpen, closeModal } = useModal();
  const [value, setValue] = useNotepad();
  const common = useTranslations("Common");

  function handleReset() {
    setValue(DEFAULT_EDITOR_DATA);
  }

  return (
    <Modal
      isOpen={isOpen(ModalIds.Notepad)}
      onClose={() => closeModal(ModalIds.Notepad)}
      title="Notepad"
      className="w-[600px]"
    >
      <Editor value={value} onChange={setValue} />

      <footer className="flex justify-end mt-5">
        <Button onClick={handleReset} variant="danger">
          {common("reset")}
        </Button>
        <Button onClick={() => closeModal(ModalIds.Notepad)} className="ml-2" type="submit">
          {common("save")}
        </Button>
      </footer>
    </Modal>
  );
}
