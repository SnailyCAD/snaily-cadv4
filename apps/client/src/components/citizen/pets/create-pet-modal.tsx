import { PET_SCHEMA } from "@snailycad/schemas";
import { PostPetsData } from "@snailycad/types/api";
import { Button, DatePickerField, Loader, TextField } from "@snailycad/ui";
import { FormRow } from "components/form/FormRow";
import { Modal } from "components/modal/Modal";
import { CitizenSuggestionsField } from "components/shared/CitizenSuggestionsField";
import { useAuth } from "context/AuthContext";
import { Form, Formik } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { useRouter } from "next/router";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";

interface CreatePetModalProps {
  onCreate?(data: PostPetsData): void;
}

export function CreatePetModal(props: CreatePetModalProps) {
  const { isOpen, closeModal } = useModal();
  const t = useTranslations("Pets");
  const { execute, state } = useFetch();
  const { cad } = useAuth();
  const router = useRouter();

  const INITIAL_VALUES = {
    name: "",
    breed: "",
    color: "",
    dateOfBirth: undefined,
    weight: "",
    citizenSearch: "",
    citizenId: "",
  };

  const weightPrefix = cad?.miscCadSettings?.weightPrefix
    ? `(${cad.miscCadSettings.weightPrefix})`
    : "";

  function handleClose() {
    closeModal(ModalIds.CreatePet);
  }

  const validate = handleValidate(PET_SCHEMA);
  async function onSubmit(data: typeof INITIAL_VALUES) {
    const { json } = await execute<PostPetsData>({
      method: "POST",
      path: "/pets",
      data,
    });

    if (json.id) {
      router.push(`/pets/${json.id}`);
      props.onCreate?.(json);
    }
  }

  return (
    <Modal
      className="w-[600px]"
      onClose={handleClose}
      title={t("createPet")}
      isOpen={isOpen(ModalIds.CreatePet)}
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ values, errors, setFieldValue }) => (
          <Form>
            <TextField
              autoFocus
              onChange={(value) => setFieldValue("name", value)}
              errorMessage={errors.name}
              value={values.name}
              label={t("name")}
            />

            <TextField
              onChange={(value) => setFieldValue("breed", value)}
              errorMessage={errors.breed}
              value={values.breed}
              label={t("breed")}
            />

            <FormRow>
              <TextField
                onChange={(value) => setFieldValue("weight", value)}
                errorMessage={errors.weight}
                value={values.weight}
                label={`${t("weight")} ${weightPrefix}`}
              />

              <TextField
                onChange={(value) => setFieldValue("color", value)}
                errorMessage={errors.color}
                value={values.color}
                label={t("color")}
              />
            </FormRow>

            <DatePickerField
              errorMessage={errors.dateOfBirth as string}
              value={values.dateOfBirth}
              onChange={(value) => value && setFieldValue("dateOfBirth", value.toDate("UTC"))}
              label={t("dateOfBirth")}
            />

            <CitizenSuggestionsField
              fromAuthUserOnly
              label={t("citizen")}
              labelFieldName="citizenSearch"
              valueFieldName="citizenId"
              allowsCustomValue={false}
            />

            <footer className="flex justify-end mt-5">
              <Button type="reset" onPress={handleClose} variant="cancel">
                Cancel
              </Button>
              <Button className="flex items-center" disabled={state === "loading"} type="submit">
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {t("createPet")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
