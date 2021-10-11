import { useTranslations } from "use-intl";
import { Formik } from "formik";
import { MEDICAL_RECORD_SCHEMA } from "@snailycad/schemas";
import { Button } from "components/Button";
import { Error } from "components/form/Error";
import { FormField } from "components/form/FormField";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import useFetch from "lib/useFetch";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import type { MedicalRecord } from "types/prisma";
import { handleValidate } from "lib/handleValidate";
import { Input } from "components/form/Input";
import { useCitizen } from "context/CitizenContext";
import { Textarea } from "components/form/Textarea";

interface Props {
  medicalRecord: MedicalRecord | null;
  onCreate?: (newV: MedicalRecord) => void;
  onUpdate?: (old: MedicalRecord, newV: MedicalRecord) => void;
  onClose?: () => void;
}

export const ManageMedicalRecordsModal = ({
  medicalRecord,
  onClose,
  onCreate,
  onUpdate,
}: Props) => {
  const { state, execute } = useFetch();
  const { isOpen, closeModal } = useModal();
  const { citizen } = useCitizen(false);
  const common = useTranslations("Common");
  const t = useTranslations("MedicalRecords");

  const validate = handleValidate(MEDICAL_RECORD_SCHEMA);

  function handleClose() {
    closeModal(ModalIds.ManageMedicalRecords);
    onClose?.();
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (medicalRecord) {
      const { json } = await execute(`/medical-records/${medicalRecord.id}`, {
        method: "PUT",
        data: values,
      });

      if (json?.id) {
        onUpdate?.(medicalRecord, json);
      }
    } else {
      const { json } = await execute("/medical-records", {
        method: "POST",
        data: { ...values, citizenId: citizen.id },
      });

      if (json?.id) {
        onCreate?.(json);
      }
    }
  }

  const INITIAL_VALUES = {
    type: medicalRecord?.type ?? "",
    description: medicalRecord?.description ?? "",
  };

  return (
    <Modal
      title={medicalRecord ? t("editMedicalRecord") : t("addMedicalRecord")}
      onClose={handleClose}
      isOpen={isOpen(ModalIds.ManageMedicalRecords)}
      className="min-w-[600px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleSubmit, handleChange, errors, values, isValid }) => (
          <form onSubmit={handleSubmit}>
            <FormField fieldId="type" label={common("type")}>
              <Input
                hasError={!!errors.type}
                onChange={handleChange}
                id="type"
                value={values.type}
              />
              <Error>{errors.type}</Error>
            </FormField>

            <FormField fieldId="description" label={common("description")}>
              <Textarea
                hasError={!!errors.description}
                value={values.description}
                name="description"
                onChange={handleChange}
              />
              <Error>{errors.description}</Error>
            </FormField>

            <footer className="mt-5 flex justify-end">
              <Button
                type="reset"
                onClick={() => closeModal(ModalIds.ManageMedicalRecords)}
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
                {medicalRecord ? common("save") : common("create")}
              </Button>
            </footer>
          </form>
        )}
      </Formik>
    </Modal>
  );
};
