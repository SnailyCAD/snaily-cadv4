import { useTranslations } from "use-intl";
import { Formik } from "formik";
import { MEDICAL_RECORD_SCHEMA } from "@snailycad/schemas";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import useFetch from "lib/useFetch";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import type { MedicalRecord } from "@snailycad/types";
import { handleValidate } from "lib/handleValidate";
import { Input } from "components/form/inputs/Input";
import { useCitizen } from "context/CitizenContext";
import { Textarea } from "components/form/Textarea";
import { Select } from "components/form/Select";
import { useValues } from "context/ValuesContext";

interface Props {
  medicalRecord: MedicalRecord | null;
  onCreate?: (newV: MedicalRecord) => void;
  onUpdate?: (old: MedicalRecord, newV: MedicalRecord) => void;
  onClose?(): void;
}

export function ManageMedicalRecordsModal({ medicalRecord, onClose, onCreate, onUpdate }: Props) {
  const { state, execute } = useFetch();
  const { isOpen, closeModal } = useModal();
  const { citizen } = useCitizen(false);
  const common = useTranslations("Common");
  const t = useTranslations("MedicalRecords");
  const { bloodGroup } = useValues();

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

  const validate = handleValidate(MEDICAL_RECORD_SCHEMA);
  const INITIAL_VALUES = {
    type: medicalRecord?.type ?? "",
    description: medicalRecord?.description ?? "",
    bloodGroup: medicalRecord?.bloodGroupId ?? "",
    citizenId: citizen.id,
  };

  return (
    <Modal
      title={medicalRecord ? t("editMedicalRecord") : t("addMedicalRecord")}
      onClose={handleClose}
      isOpen={isOpen(ModalIds.ManageMedicalRecords)}
      className="w-[600px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleSubmit, handleChange, errors, values, isValid }) => (
          <form onSubmit={handleSubmit}>
            <FormField errorMessage={errors.type} label={t("diseases")}>
              <Input onChange={handleChange} name="type" value={values.type} />
            </FormField>

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

            <FormField errorMessage={errors.description} label={common("description")}>
              <Textarea value={values.description} name="description" onChange={handleChange} />
            </FormField>

            <footer className="flex justify-end mt-5">
              <Button type="reset" onClick={handleClose} variant="cancel">
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
}
