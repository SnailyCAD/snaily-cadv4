import { useTranslations } from "use-intl";
import { Form, Formik } from "formik";
import { MEDICAL_RECORD_SCHEMA } from "@snailycad/schemas";
import { Loader, Button, TextField } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import useFetch from "lib/useFetch";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { ValueType, type MedicalRecord } from "@snailycad/types";
import { handleValidate } from "lib/handleValidate";
import { useValues } from "context/ValuesContext";
import type { PostEmsFdMedicalRecord } from "@snailycad/types/api";
import { CitizenSuggestionsField } from "components/shared/CitizenSuggestionsField";
import { ValueSelectField } from "components/form/inputs/value-select-field";
import { DEFAULT_EDITOR_DATA, Editor } from "components/editor/editor";
import { FormField } from "components/form/FormField";

interface Props {
  onCreate?(newV: MedicalRecord): void;
  onClose?(): void;
}

export function CreateMedicalRecordModal({ onClose, onCreate }: Props) {
  const { state, execute } = useFetch();
  const modalState = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("MedicalRecords");
  const { bloodGroup } = useValues();

  const validate = handleValidate(MEDICAL_RECORD_SCHEMA);

  function handleClose() {
    modalState.closeModal(ModalIds.CreateMedicalRecord);
    onClose?.();
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute<PostEmsFdMedicalRecord>({
      path: "/ems-fd/medical-records",
      method: "POST",
      data: values,
    });

    if (json?.id) {
      onCreate?.(json);
      modalState.closeModal(ModalIds.CreateMedicalRecord);
    }
  }

  const INITIAL_VALUES = {
    type: "",
    description: "",
    citizenId: "",
    citizenName: "",
    bloodGroup: null,
    descriptionData: DEFAULT_EDITOR_DATA,
  };

  return (
    <Modal
      title={t("addMedicalRecord")}
      onClose={handleClose}
      isOpen={modalState.isOpen(ModalIds.CreateMedicalRecord)}
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ setFieldValue, errors, values, isValid }) => (
          <Form>
            <CitizenSuggestionsField
              autoFocus
              fromAuthUserOnly={false}
              label={common("citizen")}
              labelFieldName="citizenName"
              valueFieldName="citizenId"
            />

            <ValueSelectField
              isClearable
              fieldName="bloodGroup"
              valueType={ValueType.BLOOD_GROUP}
              values={bloodGroup.values}
              label={t("bloodGroup")}
            />

            <TextField
              onChange={(value) => setFieldValue("type", value)}
              name="type"
              value={values.type}
              errorMessage={errors.type}
              label={common("type")}
            />

            <FormField errorMessage={errors.description} label={common("description")}>
              <Editor
                value={values.descriptionData}
                onChange={(v) => setFieldValue("descriptionData", v)}
              />
            </FormField>

            <footer className="flex justify-end mt-5">
              <Button
                type="reset"
                onPress={() => modalState.closeModal(ModalIds.CreateMedicalRecord)}
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
                {common("create")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
