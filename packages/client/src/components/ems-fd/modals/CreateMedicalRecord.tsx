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
import { Textarea } from "components/form/Textarea";
import { Select } from "components/form/Select";
import { useCitizen } from "context/CitizenContext";

interface Props {
  onCreate?: (newV: MedicalRecord) => void;
  onClose?(): void;
}

export function CreateMedicalRecordModal({ onClose, onCreate }: Props) {
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
      className="w-[600px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleSubmit, handleChange, errors, values, isValid }) => (
          <form onSubmit={handleSubmit}>
            <FormField errorMessage={errors.citizenId} label={t("citizen")}>
              <Select
                values={citizens.map((citizen) => ({
                  label: `${citizen.name} ${citizen.surname}`,
                  value: citizen.id,
                }))}
                onChange={handleChange}
                name="citizenId"
                value={values.citizenId}
              />
            </FormField>

            <FormField errorMessage={errors.type} label={common("type")}>
              <Input onChange={handleChange} name="type" value={values.type} />
            </FormField>

            <FormField errorMessage={errors.description} label={common("description")}>
              <Textarea value={values.description} name="description" onChange={handleChange} />
            </FormField>

            <footer className="flex justify-end mt-5">
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
}
