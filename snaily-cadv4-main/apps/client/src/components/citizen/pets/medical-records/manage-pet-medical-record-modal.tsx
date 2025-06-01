import { useTranslations } from "use-intl";
import { Form, Formik } from "formik";
import { PET_MEDICAL_RECORD_SCHEMA } from "@snailycad/schemas";
import { Modal } from "components/modal/Modal";
import useFetch from "lib/useFetch";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import type { PetMedicalRecord } from "@snailycad/types";
import { handleValidate } from "lib/handleValidate";
import type {
  PutPetByIdMedicalRecordsData,
  PostPetByIdMedicalRecordsData,
} from "@snailycad/types/api";
import { Button, TextField, Loader } from "@snailycad/ui";
import { usePetsState } from "state/citizen/pets-state";

interface Props {
  medicalRecord: PetMedicalRecord | null;
  onCreate?(newV: PetMedicalRecord): void;
  onUpdate?(newV: PetMedicalRecord): void;
  onClose?(): void;
}

export function ManagePetMedicalRecordModal(props: Props) {
  const { state, execute } = useFetch();
  const modalState = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("MedicalRecords");
  const currentPet = usePetsState((state) => state.currentPet);

  function handleClose() {
    modalState.closeModal(ModalIds.ManagePetMedicalRecord);
    props.onClose?.();
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!currentPet) return;

    if (props.medicalRecord) {
      const { json } = await execute<PostPetByIdMedicalRecordsData>({
        path: `/pets/${currentPet.id}/medical-records/${props.medicalRecord.id}`,
        method: "PUT",
        data: values,
      });

      if (json?.id) {
        props.onUpdate?.(json);
      }
    } else {
      const { json } = await execute<PutPetByIdMedicalRecordsData>({
        path: `/pets/${currentPet.id}/medical-records`,
        method: "POST",
        data: { ...values },
      });

      if (json?.id) {
        props.onCreate?.(json);
      }
    }
  }

  const validate = handleValidate(PET_MEDICAL_RECORD_SCHEMA);

  const INITIAL_VALUES = {
    type: props.medicalRecord?.type ?? "",
    description: props.medicalRecord?.description ?? "",
  };

  return (
    <Modal
      title={props.medicalRecord ? t("editMedicalRecord") : t("addMedicalRecord")}
      onClose={handleClose}
      isOpen={modalState.isOpen(ModalIds.ManagePetMedicalRecord)}
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
                {props.medicalRecord ? common("save") : common("create")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
