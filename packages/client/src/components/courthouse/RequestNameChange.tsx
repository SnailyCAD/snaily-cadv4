import { NAME_CHANGE_REQUEST_SCHEMA } from "@snailycad/schemas";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { FormRow } from "components/form/FormRow";
import { Input } from "components/form/inputs/Input";
import { Select } from "components/form/Select";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useCitizen } from "context/CitizenContext";
import { useModal } from "context/ModalContext";
import { Form, Formik } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";

export function RequestNameChangeModal() {
  const { closeModal, isOpen } = useModal();
  const { citizens } = useCitizen();
  const common = useTranslations("Common");
  const { state } = useFetch();
  const t = useTranslations("Courthouse");

  const validate = handleValidate(NAME_CHANGE_REQUEST_SCHEMA);
  const INITIAL_VALUES = {
    citizenId: null,
    newName: "",
    newSurname: "",
  };

  return (
    <Modal
      onClose={() => closeModal(ModalIds.RequestNameChange)}
      isOpen={isOpen(ModalIds.RequestNameChange)}
      title={t("requestNameChange")}
      className="w-[500px]"
    >
      <Formik validate={validate} onSubmit={() => void 0} initialValues={INITIAL_VALUES}>
        {({ values, errors, isValid, handleChange }) => (
          <Form>
            <FormField label={common("citizen")} errorMessage={errors.citizenId}>
              <Select
                name="citizenId"
                values={citizens.map((citizen) => ({
                  label: `${citizen.name} ${citizen.surname}`,
                  value: citizen.id,
                }))}
                value={values.citizenId}
                onChange={handleChange}
              />
            </FormField>

            <FormRow>
              <FormField label="Name" errorMessage={errors.newName}>
                <Input name="newName" value={values.newName} onChange={handleChange} />
              </FormField>

              <FormField label="Surname" errorMessage={errors.newSurname}>
                <Input name="newSurname" value={values.newSurname} onChange={handleChange} />
              </FormField>
            </FormRow>

            <footer className="flex justify-end mt-5">
              <Button variant="cancel" type="reset">
                {common("cancel")}
              </Button>
              <Button
                className="flex items-center"
                disabled={!isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {/* {t("request")} */}
                do
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
