import { useTranslations } from "use-intl";
import { Form, Formik } from "formik";
import { DOCTOR_VISIT_SCHEMA } from "@snailycad/schemas";
import { Loader, Button, TextField } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import useFetch from "lib/useFetch";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import type { DoctorVisit } from "@snailycad/types";
import { handleValidate } from "lib/handleValidate";
import type { PostEmsFdDoctorVisit, PostEmsFdMedicalRecordsSearchData } from "@snailycad/types/api";
import { CitizenSuggestionsField } from "components/shared/CitizenSuggestionsField";

interface Props {
  onCreate?(newV: DoctorVisit): void;
  onClose?(): void;
  citizen?: PostEmsFdMedicalRecordsSearchData;
}

export function CreateDoctorVisitModal({ citizen, onClose, onCreate }: Props) {
  const { state, execute } = useFetch();
  const modalState = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Ems");

  const validate = handleValidate(DOCTOR_VISIT_SCHEMA);

  function handleClose() {
    modalState.closeModal(ModalIds.CreateDoctorVisit);
    onClose?.();
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute<PostEmsFdDoctorVisit>({
      path: "/ems-fd/doctor-visit",
      method: "POST",
      data: values,
    });

    if (json?.id) {
      onCreate?.(json);
      modalState.closeModal(ModalIds.CreateDoctorVisit);
    }
  }

  const INITIAL_VALUES = {
    citizenId: citizen?.id ?? "",
    citizenName: citizen?.name ? `${citizen.name} ${citizen.surname}` : "",

    description: "",
    diagnosis: "",
    medications: "",
    conditions: "",
  };

  return (
    <Modal
      title={t("createDoctorVisit")}
      onClose={handleClose}
      isOpen={modalState.isOpen(ModalIds.CreateDoctorVisit)}
      className="w-[600px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ setFieldValue, errors, values, isValid }) => (
          <Form>
            <CitizenSuggestionsField
              isDisabled={!!citizen}
              autoFocus
              fromAuthUserOnly={false}
              label={common("citizen")}
              labelFieldName="citizenName"
              valueFieldName="citizenId"
            />

            <TextField
              onChange={(value) => setFieldValue("diagnosis", value)}
              name="diagnosis"
              value={values.diagnosis}
              errorMessage={errors.diagnosis}
              label={t("diagnosis")}
              isTextarea
            />

            <TextField
              onChange={(value) => setFieldValue("medications", value)}
              name="medications"
              value={values.medications}
              errorMessage={errors.medications}
              label={t("medications")}
              isTextarea
            />

            <TextField
              onChange={(value) => setFieldValue("conditions", value)}
              name="conditions"
              value={values.conditions}
              errorMessage={errors.conditions}
              label={t("conditions")}
              isTextarea
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
                onPress={() => modalState.closeModal(ModalIds.CreateDoctorVisit)}
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
