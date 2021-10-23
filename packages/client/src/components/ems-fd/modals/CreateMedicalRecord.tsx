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
import { Textarea } from "components/form/Textarea";
import { Select } from "components/form/Select";
import { useCitizen } from "context/CitizenContext";

interface Props {
  onCreate?: (newV: MedicalRecord) => void;
  onClose?: () => void;
}

export const CreateMedicalRecordModal = ({ onClose, onCreate }: Props) => {
  const { state, execute } = useFetch();
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("MedicalRecords");
  const { citizens } = useCitizen();

  const validate = handleValidate(MEDICAL_RECORD_SCHEMA);

  function handleClose() {
    closeModal(ModalIds.CreateMedicalRecord);
    onClose?.();
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute("/ems-fd/medical-record", {
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
  };

  return (
    <Modal
      title={t("addMedicalRecord")}
      onClose={handleClose}
      isOpen={isOpen(ModalIds.CreateMedicalRecord)}
      className="min-w-[600px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleSubmit, handleChange, errors, values, isValid }) => (
          <form onSubmit={handleSubmit}>
            <FormField fieldId="citizenId" label={t("citizen")}>
              <Select
                values={citizens.map((citizen) => ({
                  label: `${citizen.name} ${citizen.surname}`,
                  value: citizen.id,
                }))}
                hasError={!!errors.citizenId}
                onChange={handleChange}
                name="citizenId"
                value={values.citizenId}
              />
              <Error>{errors.citizenId}</Error>
            </FormField>

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
                onClick={() => closeModal(ModalIds.CreateMedicalRecord)}
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
          </form>
        )}
      </Formik>
    </Modal>
  );
};
