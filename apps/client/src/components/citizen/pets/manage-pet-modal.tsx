import * as React from "react";
import { PET_SCHEMA } from "@snailycad/schemas";
import type { Pet } from "@snailycad/types";
import type { PostPetsData } from "@snailycad/types/api";
import { Button, DatePickerField, Loader, TextField, FormRow } from "@snailycad/ui";
import { ImageSelectInput, validateFile } from "components/form/inputs/ImageSelectInput";
import { Modal } from "components/modal/Modal";
import { CitizenSuggestionsField } from "components/shared/CitizenSuggestionsField";
import { useAuth } from "context/AuthContext";
import { Form, Formik, type FormikHelpers } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { useRouter } from "next/router";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";

interface ManagePetModalProps {
  pet: Pet | null;
  onCreate?(data: PostPetsData): void;
}

export function ManagePetModal(props: ManagePetModalProps) {
  const modalState = useModal();
  const t = useTranslations("Pets");
  const common = useTranslations("Common");
  const { execute, state } = useFetch();
  const { cad } = useAuth();
  const router = useRouter();
  const [image, setImage] = React.useState<File | string | null>(null);

  const INITIAL_VALUES = {
    name: props.pet?.name ?? "",
    breed: props.pet?.breed ?? "",
    color: props.pet?.color ?? "",
    dateOfBirth: props.pet?.dateOfBirth ? new Date(props.pet.dateOfBirth) : undefined,
    weight: props.pet?.weight ?? "",
    citizenSearch: props.pet ? `${props.pet.citizen.name} ${props.pet.citizen.surname}` : "",
    citizenId: props.pet?.citizenId ?? null,
  };

  const weightPrefix = cad?.miscCadSettings?.weightPrefix
    ? `(${cad.miscCadSettings.weightPrefix})`
    : "";

  function handleClose() {
    modalState.closeModal(ModalIds.ManagePet);
  }

  const validate = handleValidate(PET_SCHEMA);
  async function onSubmit(
    data: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    let fd;
    const validatedImage = validateFile(image, helpers);
    if (validatedImage) {
      if (typeof validatedImage !== "string") {
        fd = new FormData();
        fd.set("image", validatedImage, validatedImage.name);
      }
    }

    if (props.pet) {
      const { json } = await execute<PostPetsData>({
        method: "PUT",
        path: `/pets/${props.pet.id}`,
        data,
      });

      if (json.id) {
        await execute({
          path: `/pets/${json.id}/image`,
          method: "POST",
          data: fd,
          helpers,
          headers: { "content-type": "multipart/form-data" },
        });

        router.push(`/pets/${json.id}`);
        modalState.closeModal(ModalIds.ManagePet);
      }
    } else {
      const { json } = await execute<PostPetsData>({
        method: "POST",
        path: "/pets",
        data,
      });

      if (json.id) {
        await execute({
          path: `/pets/${json.id}/image`,
          method: "POST",
          data: fd,
          helpers,
          headers: { "content-type": "multipart/form-data" },
        });

        router.push(`/pets/${json.id}`);
        props.onCreate?.(json);
        modalState.closeModal(ModalIds.ManagePet);
      }
    }
  }

  return (
    <Modal
      className="w-[600px]"
      onClose={handleClose}
      title={t("createPet")}
      isOpen={modalState.isOpen(ModalIds.ManagePet)}
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
              isDisabled={Boolean(props.pet)}
            />

            <ImageSelectInput image={image} setImage={setImage} isOptional />

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
                {common("cancel")}
              </Button>
              <Button className="flex items-center" disabled={state === "loading"} type="submit">
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {props.pet ? common("save") : t("createPet")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
