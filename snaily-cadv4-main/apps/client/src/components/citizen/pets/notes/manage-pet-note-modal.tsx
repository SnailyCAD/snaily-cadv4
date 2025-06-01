import type { Note } from "@snailycad/types";
import { Loader, Button, TextField } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/modal-ids";
import type { PutNotesData, PostNotesData } from "@snailycad/types/api";
import { usePetsState } from "state/citizen/pets-state";
import { handleValidate } from "lib/handleValidate";
import { PET_NOTE_SCHEMA } from "@snailycad/schemas";

interface Props {
  note: Note | null;

  onCreate?(note: Note): void;
  onUpdate?(note: Note): void;
  onClose?(): void;
}

export function ManagePetNoteModal(props: Props) {
  const modalState = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Pets");
  const { state, execute } = useFetch();
  const currentPet = usePetsState((state) => state.currentPet);

  function handleClose() {
    modalState.closeModal(ModalIds.ManageNote);
    props.onClose?.();
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!currentPet) return;

    if (props.note) {
      const { json } = await execute<PutNotesData>({
        path: `/pets/${currentPet.id}/notes/${props.note.id}`,
        method: "PUT",
        data: { text: values.text },
      });

      if (json.id) {
        props.onUpdate?.(json);
        handleClose();
      }
    } else {
      const { json } = await execute<PostNotesData>({
        path: `/pets/${currentPet.id}/notes`,
        method: "POST",
        data: { text: values.text },
      });

      if (json.id) {
        props.onCreate?.(json);
        handleClose();
      }
    }
  }

  const INITIAL_VALUES = {
    text: props.note?.text ?? "",
  };
  const validate = handleValidate(PET_NOTE_SCHEMA);

  return (
    <Modal
      title={t("manageNote")}
      isOpen={modalState.isOpen(ModalIds.ManageNote)}
      onClose={handleClose}
      className="w-[600px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ setFieldValue, values, errors, isValid }) => (
          <Form autoComplete="off">
            <TextField
              isTextarea
              errorMessage={errors.text as string}
              label={common("description")}
              name="text"
              onChange={(value) => setFieldValue("text", value)}
              value={values.text}
            />

            <footer className="flex justify-end mt-5">
              <Button
                disabled={state === "loading"}
                type="reset"
                onPress={handleClose}
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
                {props.note ? common("save") : common("create")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
