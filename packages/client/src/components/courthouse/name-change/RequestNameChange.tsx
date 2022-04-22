import { NAME_CHANGE_REQUEST_SCHEMA } from "@snailycad/schemas";
import type { NameChangeRequest } from "@snailycad/types";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { FormRow } from "components/form/FormRow";
import { Input } from "components/form/inputs/Input";
import { Select } from "components/form/Select";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useCitizen } from "context/CitizenContext";
import { useModal } from "state/modalState";
import { Form, Formik, FormikHelpers } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";

interface Props {
  onCreate?(request: NameChangeRequest): void;
}

export function RequestNameChangeModal({ onCreate }: Props) {
  const { closeModal, isOpen } = useModal();
  const { citizens } = useCitizen();
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const t = useTranslations("Courthouse");

  const validate = handleValidate(NAME_CHANGE_REQUEST_SCHEMA);
  const INITIAL_VALUES = {
    citizenId: null,
    newName: "",
    newSurname: "",
  };

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    const { json } = await execute("/name-change", {
      method: "POST",
      data: values,
      helpers,
    });

    if (json.id) {
      onCreate?.(json);
      closeModal(ModalIds.RequestNameChange);
    }
  }

  return (
    <Modal
      onClose={() => closeModal(ModalIds.RequestNameChange)}
      isOpen={isOpen(ModalIds.RequestNameChange)}
      title={t("requestNameChange")}
      className="w-[600px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
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
              <FormField label={t("newName")} errorMessage={errors.newName}>
                <Input name="newName" value={values.newName} onChange={handleChange} />
              </FormField>

              <FormField label={t("newSurname")} errorMessage={errors.newSurname}>
                <Input name="newSurname" value={values.newSurname} onChange={handleChange} />
              </FormField>
            </FormRow>

            <footer className="flex justify-end mt-5">
              <Button
                onClick={() => closeModal(ModalIds.RequestNameChange)}
                variant="cancel"
                type="reset"
              >
                {common("cancel")}
              </Button>
              <Button
                className="flex items-center"
                disabled={!isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {t("request")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
