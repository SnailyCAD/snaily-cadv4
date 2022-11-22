import type { Note } from "@snailycad/types";
import { Loader, Button, TextField } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import type { VehicleSearchResult } from "state/search/vehicle-search-state";
import type { NameSearchResult } from "state/search/name-search-state";
import type { PutNotesData, PostNotesData } from "@snailycad/types/api";

interface Props {
  note: Note | null;
  type: "CITIZEN" | "VEHICLE";
  currentResult: NameSearchResult | VehicleSearchResult;

  onCreate?(note: Note): void;
  onUpdate?(note: Note): void;
  onClose?(): void;
}

export function ManageNoteModal({ onCreate, onUpdate, onClose, currentResult, type, note }: Props) {
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const { state, execute } = useFetch();

  function handleClose() {
    onClose?.();
    closeModal(ModalIds.ManageNote);
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!currentResult) return;

    if (note) {
      const { json } = await execute<PutNotesData>({
        path: `/notes/${note.id}`,
        method: "PUT",
        data: { text: values.text, type, itemId: currentResult.id },
      });

      if (json.id) {
        onUpdate?.(json);
        handleClose();
      }
    } else {
      const { json } = await execute<PostNotesData>({
        path: "/notes",
        method: "POST",
        data: { text: values.text, type, itemId: currentResult.id },
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
        {({ setFieldValue, values, errors, isValid }) => (
          <Form autoComplete="off">
            <TextField
              isTextarea
              errorMessage={errors.text as string}
              label={t("text")}
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
                {note ? common("save") : common("create")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
