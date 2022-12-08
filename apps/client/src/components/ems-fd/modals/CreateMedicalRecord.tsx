import { useTranslations } from "use-intl";
import { Form, Formik } from "formik";
import { MEDICAL_RECORD_SCHEMA } from "@snailycad/schemas";
import { Loader, Button, TextField } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { Modal } from "components/modal/Modal";
import useFetch from "lib/useFetch";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import type { MedicalRecord } from "@snailycad/types";
import { handleValidate } from "lib/handleValidate";
import { Select } from "components/form/Select";
import { useValues } from "context/ValuesContext";
import type { PostEmsFdMedicalRecord } from "@snailycad/types/api";
import { CitizenSuggestionsField } from "components/shared/CitizenSuggestionsField";

interface Props {
  onCreate?(newV: MedicalRecord): void;
  onClose?(): void;
}

export function CreateMedicalRecordModal({ onClose, onCreate }: Props) {
  const { state, execute } = useFetch();
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("MedicalRecords");
  const { bloodGroup } = useValues();

  const validate = handleValidate(MEDICAL_RECORD_SCHEMA);

  function handleClose() {
    closeModal(ModalIds.CreateMedicalRecord);
    onClose?.();
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute<PostEmsFdMedicalRecord>({
      path: "/ems-fd/medical-record",
      method: "POST",
      data: values,
    });

    if (json?.id) {
      onCreate?.(json);
      closeModal(ModalIds.CreateMedicalRecord);
    }
  }

  const INITIAL_VALUES = {
    type: "",
    description: "",
    citizenId: "",
    citizenName: "",
    bloodGroup: null,
  };

  return (
    <Modal
      title={t("addMedicalRecord")}
      onClose={handleClose}
      isOpen={isOpen(ModalIds.CreateMedicalRecord)}
      className="w-[600px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, setFieldValue, errors, values, isValid }) => (
          <Form>
            <CitizenSuggestionsField
              autoFocus
              fromAuthUserOnly={false}
              label={common("citizen")}
              labelFieldName="citizenName"
              valueFieldName="citizenId"
            />

            <FormField errorMessage={errors.bloodGroup} label={t("bloodGroup")}>
              <Select
                values={bloodGroup.values.map((v) => ({
                  value: v.id,
                  label: v.value,
                }))}
                onChange={handleChange}
                name="bloodGroup"
                value={values.bloodGroup}
              />
            </FormField>

            <TextField
              onChange={(value) => setFieldValue("type", value)}
              name="type"
              value={values.type}
              errorMessage={errors.type}
              label={common("type")}
            />

            <TextField
              isTextarea
              errorMessage={errors.description}
              label={common("description")}
              value={values.description}
              name="description"
              onChange={(value) => setFieldValue("description", value)}
            />

            <footer className="flex justify-end mt-5">
              <Button
                type="reset"
                onPress={() => closeModal(ModalIds.CreateMedicalRecord)}
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
