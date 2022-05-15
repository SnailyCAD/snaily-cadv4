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
}

export function ManageNoteModal({ note }: Props) {
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const { currentResult, setCurrentResult } = useNameSearch();
  const { state, execute } = useFetch();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!currentResult) return;

    const { json } = await execute("/notes", {
      method: "POST",
      data: { text: values.text, type: "CITIZEN", itemId: currentResult.id },
    });

    if (json.id) {
      setCurrentResult({ ...currentResult, ...json });
      closeModal(ModalIds.ManageNote);
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
      onClose={() => closeModal(ModalIds.ManageNote)}
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
                onClick={() => closeModal(ModalIds.ManageNote)}
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
                {common("save")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
