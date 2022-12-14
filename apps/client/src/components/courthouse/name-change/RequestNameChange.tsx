import { NAME_CHANGE_REQUEST_SCHEMA } from "@snailycad/schemas";
import { Input, Loader, Button } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { FormRow } from "components/form/FormRow";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik, FormikHelpers } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { CitizenSuggestionsField } from "components/shared/CitizenSuggestionsField";
import type { GetNameChangeRequestsData, PostNameChangeRequestsData } from "@snailycad/types/api";

interface Props {
  onCreate?(request: GetNameChangeRequestsData[number]): void;
}

export function RequestNameChangeModal({ onCreate }: Props) {
  const { closeModal, isOpen } = useModal();
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const t = useTranslations("Courthouse");

  const validate = handleValidate(NAME_CHANGE_REQUEST_SCHEMA);
  const INITIAL_VALUES = {
    citizenId: null,
    citizenName: "",
    newName: "",
    newSurname: "",
  };

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    const { json } = await execute<PostNameChangeRequestsData, typeof INITIAL_VALUES>({
      path: "/name-change",
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
            <CitizenSuggestionsField
              allowsCustomValue
              autoFocus
              label={common("citizen")}
              fromAuthUserOnly
              labelFieldName="citizenName"
              valueFieldName="citizenId"
            />

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
                onPress={() => closeModal(ModalIds.RequestNameChange)}
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
