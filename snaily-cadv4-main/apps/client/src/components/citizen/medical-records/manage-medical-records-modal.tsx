import { useTranslations } from "use-intl";
import { Form, Formik } from "formik";
import { MEDICAL_RECORD_SCHEMA } from "@snailycad/schemas";
import { Modal } from "components/modal/Modal";
import useFetch from "lib/useFetch";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { type BaseCitizen, type MedicalRecord, ValueType } from "@snailycad/types";
import { handleValidate } from "lib/handleValidate";
import { useValues } from "context/ValuesContext";
import type {
  PostCitizenMedicalRecordsData,
  PutCitizenMedicalRecordsData,
} from "@snailycad/types/api";
import { Button, TextField, Loader } from "@snailycad/ui";
import { ValueSelectField } from "components/form/inputs/value-select-field";
import { Editor, dataToSlate } from "components/editor/editor";
import { FormField } from "components/form/FormField";

interface Props {
  isEmsFd?: boolean;
  medicalRecord: MedicalRecord | null;
  citizen: BaseCitizen & { medicalRecords?: MedicalRecord[] };
  onCreate?(newV: MedicalRecord): void;
  onUpdate?(old: MedicalRecord, newV: MedicalRecord): void;
  onClose?(): void;
}

export function ManageMedicalRecordsModal({
  isEmsFd,
  medicalRecord,
  onClose,
  onCreate,
  onUpdate,
  citizen,
}: Props) {
  const { state, execute } = useFetch();
  const modalState = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("MedicalRecords");
  const { bloodGroup } = useValues();

  function handleClose() {
    modalState.closeModal(ModalIds.ManageMedicalRecords);
    onClose?.();
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const prependix = isEmsFd ? "/ems-fd" : "";

    if (medicalRecord) {
      const { json } = await execute<PutCitizenMedicalRecordsData>({
        path: `${prependix}/medical-records/${medicalRecord.id}`,
        method: "PUT",
        data: values,
      });

      if (json?.id) {
        onUpdate?.(medicalRecord, json);
        onClose?.();
      }
    } else {
      const { json } = await execute<PostCitizenMedicalRecordsData>({
        path: `${prependix}/medical-records`,
        method: "POST",
        data: { ...values, citizenId: citizen.id },
      });

      if (json?.id) {
        onCreate?.(json);
        onClose?.();
      }
    }
  }

  const validate = handleValidate(MEDICAL_RECORD_SCHEMA);
  const bloodGroupId = citizen.medicalRecords?.find((v) => v.bloodGroupId)?.bloodGroupId;

  const INITIAL_VALUES = {
    type: medicalRecord?.type ?? "",
    description: medicalRecord?.description ?? "",
    descriptionData: dataToSlate(medicalRecord),
    bloodGroup: bloodGroupId ?? "",
    citizenId: citizen.id,
  };

  return (
    <Modal
      title={medicalRecord ? t("editMedicalRecord") : t("addMedicalRecord")}
      onClose={handleClose}
      isOpen={modalState.isOpen(ModalIds.ManageMedicalRecords)}
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

            <FormField errorMessage={errors.description} label={common("description")}>
              <Editor
                value={values.descriptionData}
                onChange={(v) => setFieldValue("descriptionData", v)}
              />
            </FormField>

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
