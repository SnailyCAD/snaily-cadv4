import { NAME_CHANGE_REQUEST_SCHEMA } from "@snailycad/schemas";
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

interface Props {
  courtEntry: CourtEntry | null;
  onCreate?(entry: CourtEntry): void;
}

export function ManageCourtEntry({ courtEntry, onCreate }: Props) {
  const { closeModal, isOpen } = useModal();
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const t = useTranslations("Courthouse");

  const validate = handleValidate(NAME_CHANGE_REQUEST_SCHEMA);
  const INITIAL_VALUES = {
    descriptionData: courtEntry?.descriptionData ?? DEFAULT_EDITOR_DATA,
    title: courtEntry?.title ?? "",
    caseNumber: courtEntry?.caseNumber ?? "",
  };

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    const { json } = await execute("/name-change", {
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
      onClose={() => closeModal(ModalIds.ManageCourtEntry)}
      isOpen={isOpen(ModalIds.ManageCourtEntry)}
      title={t("manageCourtEntry")}
      className="w-[750px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ values, errors, isValid, setFieldValue, handleChange }) => (
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

            <footer className="flex justify-end mt-5">
              <Button
                onClick={() => closeModal(ModalIds.ManageCourtEntry)}
                variant="cancel"
                type="reset"
              >
                {common("cancel")}
              </Button>
              <Button
                className="flex items-center"
                disabled={!isValid || state === "loading"}
                type="submit"
              >
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
