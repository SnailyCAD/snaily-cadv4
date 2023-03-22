import { useTranslations } from "use-intl";
import { Form, Formik } from "formik";
import { MEDICAL_RECORD_SCHEMA } from "@snailycad/schemas";
import { Modal } from "components/modal/Modal";
import useFetch from "lib/useFetch";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { MedicalRecord, ValueType } from "@snailycad/types";
import { handleValidate } from "lib/handleValidate";
import { useCitizen } from "context/CitizenContext";
import { useValues } from "context/ValuesContext";
import type {
  PostCitizenMedicalRecordsData,
  PutCitizenMedicalRecordsData,
} from "@snailycad/types/api";
import { Button, TextField, Loader } from "@snailycad/ui";
import { ValueSelectField } from "components/form/inputs/value-select-field";

interface Props {
  medicalRecord: MedicalRecord | null;
  onCreate?(newV: MedicalRecord): void;
  onUpdate?(old: MedicalRecord, newV: MedicalRecord): void;
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
      const { json } = await execute<PutCitizenMedicalRecordsData>({
        path: `/medical-records/${medicalRecord.id}`,
        method: "PUT",
        data: values,
      });

      if (json?.id) {
        onUpdate?.(medicalRecord, json);
      }
    } else {
      const { json } = await execute<PostCitizenMedicalRecordsData>({
        path: "/medical-records",
        method: "POST",
        data: { ...values, citizenId: citizen.id },
      });

      if (json?.id) {
        onCreate?.(json);
      }
    }
  }

  const validate = handleValidate(MEDICAL_RECORD_SCHEMA);
  const bloodGroupId = citizen.medicalRecords.find((v) => v.bloodGroupId)?.bloodGroupId;

  const INITIAL_VALUES = {
    type: medicalRecord?.type ?? "",
    description: medicalRecord?.description ?? "",
    bloodGroup: bloodGroupId ?? "",
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
        {({ setFieldValue, errors, values, isValid }) => (
          <Form>
            <TextField
              label={t("diseases")}
              value={values.type}
              onChange={(value) => setFieldValue("type", value)}
              name="type"
              errorMessage={errors.type}
            />

            <ValueSelectField
              isClearable
              fieldName="bloodGroup"
              valueType={ValueType.BLOOD_GROUP}
              values={bloodGroup.values}
              label={t("bloodGroup")}
            />
            {bloodGroupId && bloodGroupId !== values.bloodGroup ? (
              <small className="inline-block mb-3 text-base">{t("info_bloodgroup")}</small>
            ) : null}

            <TextField
              label={common("description")}
              errorMessage={errors.description}
              value={values.description}
              onChange={(value) => setFieldValue("description", value)}
              name="description"
              isTextarea
            />

            <footer className="flex justify-end mt-5">
              <Button type="reset" onPress={handleClose} variant="cancel">
                {common("cancel")}
              </Button>
              <Button
                className="flex items-center gap-2"
                disabled={!isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader /> : null}
                {medicalRecord ? common("save") : common("create")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
