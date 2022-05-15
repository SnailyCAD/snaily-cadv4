import type { Note } from "@snailycad/types";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { useNameSearch } from "state/search/nameSearchState";
import { ModalIds } from "types/ModalIds";
import { Textarea } from "components/form/Textarea";
import { Loader } from "components/Loader";

interface Props {
  note: Note | null;
  onCreate?(note: Note): void;
  onUpdate?(note: Note): void;
  onClose?(): void;
}

export function ManageNoteModal({ onCreate, onUpdate, onClose, note }: Props) {
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const { currentResult } = useNameSearch();
  const { state, execute } = useFetch();

  function handleClose() {
    onClose?.();
    closeModal(ModalIds.ManageNote);
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!currentResult) return;

    if (note) {
      const { json } = await execute(`/notes/${note.id}`, {
        method: "PUT",
        data: { text: values.text, type: "CITIZEN", itemId: currentResult.id },
      });

      if (json.id) {
        onUpdate?.(json);
        handleClose();
      }
    } else {
      const { json } = await execute("/notes", {
        method: "POST",
        data: { text: values.text, type: "CITIZEN", itemId: currentResult.id },
      });

      if (json.id) {
        onCreate?.(json);
        handleClose();
      }
    }
  }

  if (!currentResult) {
    return null;
  }

  const INITIAL_VALUES = {
    text: note?.text ?? "",
  };

  return (
    <Modal
      title={t("manageNote")}
      isOpen={isOpen(ModalIds.ManageNote)}
      onClose={handleClose}
      className="w-[600px]"
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, values, errors, isValid }) => (
          <Form autoComplete="off">
            <FormField errorMessage={errors.text as string} label={t("text")}>
              <Textarea name="text" onChange={handleChange} value={values.text} />
            </FormField>

            <footer className="flex justify-end mt-5">
              <Button
                disabled={state === "loading"}
                type="reset"
                onClick={handleClose}
                variant="cancel"
              >
                {common("cancel")}
              </Button>
              <Button
                className="flex items-center"
                disabled={!isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {note ? common("save") : common("create")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
