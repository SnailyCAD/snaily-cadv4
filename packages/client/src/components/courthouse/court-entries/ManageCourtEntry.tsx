import { COURT_ENTRY_SCHEMA } from "@snailycad/schemas";
import type { CourtEntry } from "@snailycad/types";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik, FormikHelpers } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { DEFAULT_EDITOR_DATA, Editor } from "components/modal/DescriptionModal/Editor";
import { CourtEntryDates } from "./CourtEntryDates";

interface Props {
  courtEntry: CourtEntry | null;
  onClose?(): void;
  onCreate?(entry: CourtEntry): void;
}

export function ManageCourtEntry({ courtEntry, onClose, onCreate }: Props) {
  const { closeModal, isOpen } = useModal();
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const t = useTranslations("Courthouse");

  const validate = handleValidate(COURT_ENTRY_SCHEMA);
  const INITIAL_VALUES = {
    descriptionData: courtEntry?.descriptionData ?? DEFAULT_EDITOR_DATA,
    title: courtEntry?.title ?? "",
    caseNumber: courtEntry?.caseNumber ?? "",
    dates: courtEntry?.dates ?? [],
  };

  function handleClose() {
    onClose?.();
    closeModal(ModalIds.ManageCourtEntry);
  }

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    const { json } = await execute("/court-entries", {
      method: "POST",
      data: values,
      helpers,
    });

    if (json.id) {
      onCreate?.(json);
      closeModal(ModalIds.ManageCourtEntry);
    }
  }

  return (
    <Modal
      onClose={handleClose}
      isOpen={isOpen(ModalIds.ManageCourtEntry)}
      title={t("manageCourtEntry")}
      className="w-[750px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ values, errors, setFieldValue, handleChange }) => (
          <Form>
            <FormField label={t("title")} errorMessage={errors.title}>
              <Input name="title" value={values.title} onChange={handleChange} />
            </FormField>

            <FormField label={t("caseNumber")} errorMessage={errors.caseNumber}>
              <Input name="caseNumber" value={values.caseNumber} onChange={handleChange} />
            </FormField>

            <FormField
              label={common("description")}
              errorMessage={errors.descriptionData as string}
            >
              <Editor
                value={values.descriptionData}
                onChange={(v) => setFieldValue("descriptionData", v)}
              />
            </FormField>

            <CourtEntryDates
              onCreate={(date) => setFieldValue("dates", [...values.dates, date])}
              onUpdate={() => "TODO"}
              dates={values.dates}
            />

            <footer className="flex justify-end mt-5">
              <Button onClick={handleClose} variant="cancel" type="reset">
                {common("cancel")}
              </Button>
              <Button className="flex items-center" disabled={state === "loading"} type="submit">
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {courtEntry ? common("save") : common("create")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
