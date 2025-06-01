import { NAME_CHANGE_REQUEST_SCHEMA } from "@snailycad/schemas";
import { Loader, Button, FormRow, TextField } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik, type FormikHelpers } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/modal-ids";
import { CitizenSuggestionsField } from "components/shared/CitizenSuggestionsField";
import type { GetNameChangeRequestsData, PostNameChangeRequestsData } from "@snailycad/types/api";

interface Props {
  onCreate?(request: GetNameChangeRequestsData[number]): void;
}

export function RequestNameChangeModal({ onCreate }: Props) {
  const modalState = useModal();
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const t = useTranslations("Courthouse");

  const validate = handleValidate(NAME_CHANGE_REQUEST_SCHEMA);
  const INITIAL_VALUES = {
    citizenId: null,
    citizenName: "",
    newName: "",
    newSurname: "",
    description: "",
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
      modalState.closeModal(ModalIds.RequestNameChange);
    }
  }

  return (
    <Modal
      onClose={() => modalState.closeModal(ModalIds.RequestNameChange)}
      isOpen={modalState.isOpen(ModalIds.RequestNameChange)}
      title={t("requestNameChange")}
      className="w-[600px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ values, errors, isValid, setFieldValue }) => (
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
              <TextField
                label={t("newName")}
                onChange={(value) => setFieldValue("newName", value)}
                value={values.newName}
                errorMessage={errors.newName}
              />

              <TextField
                label={t("newSurname")}
                onChange={(value) => setFieldValue("newSurname", value)}
                value={values.newSurname}
                errorMessage={errors.newSurname}
              />
            </FormRow>

            <TextField
              isOptional
              isTextarea
              errorMessage={errors.description}
              value={values.description}
              onChange={(value) => setFieldValue("description", value)}
              label={common("description")}
            />

            <footer className="flex justify-end mt-5">
              <Button
                onPress={() => modalState.closeModal(ModalIds.RequestNameChange)}
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
