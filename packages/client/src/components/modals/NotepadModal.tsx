import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { Textarea } from "components/form/Textarea";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { useNotepad } from "hooks/shared/useNotepad";
import { ModalIds } from "types/ModalIds";

export function NotepadModal() {
  const { isOpen, closeModal } = useModal();
  const [value, setValue] = useNotepad();
  const common = useTranslations("Common");

  function handleReset() {
    setValue("");
  }

  return (
    <Modal
      isOpen={isOpen(ModalIds.Notepad)}
      onClose={() => closeModal(ModalIds.Notepad)}
      title="notepad"
      className="w-[600px]"
    >
      <Textarea className="min-h-[10em]" value={value} onChange={(e) => setValue(e.target.value)} />

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
