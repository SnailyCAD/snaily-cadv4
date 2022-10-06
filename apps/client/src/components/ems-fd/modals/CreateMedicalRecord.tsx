import { useTranslations } from "use-intl";
import { Form, Formik } from "formik";
import { MEDICAL_RECORD_SCHEMA } from "@snailycad/schemas";
import { Textarea, Loader, Input, Button } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { Modal } from "components/modal/Modal";
import useFetch from "lib/useFetch";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import type { MedicalRecord } from "@snailycad/types";
import { handleValidate } from "lib/handleValidate";
import { Select } from "components/form/Select";
import { useValues } from "context/ValuesContext";
import { InputSuggestions } from "components/form/inputs/InputSuggestions";
import { useImageUrl } from "hooks/useImageUrl";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import type { NameSearchResult } from "state/search/nameSearchState";
import type { PostEmsFdMedicalRecord } from "@snailycad/types/api";
import Image from "next/future/image";

interface Props {
  onCreate?(newV: MedicalRecord): void;
  onClose?(): void;
}

export function CreateMedicalRecordModal({ onClose, onCreate }: Props) {
  const { state, execute } = useFetch();
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("MedicalRecords");
  const { bloodGroup } = useValues();
  const { makeImageUrl } = useImageUrl();
  const { SOCIAL_SECURITY_NUMBERS } = useFeatureEnabled();

  const validate = handleValidate(MEDICAL_RECORD_SCHEMA);

  function handleClose() {
    closeModal(ModalIds.CreateMedicalRecord);
    onClose?.();
  }

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute<PostEmsFdMedicalRecord>({
      path: "/ems-fd/medical-record",
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
    citizenName: "",
    bloodGroup: null,
  };

  return (
    <Modal
      title={t("addMedicalRecord")}
      onClose={handleClose}
      isOpen={isOpen(ModalIds.CreateMedicalRecord)}
      className="w-[600px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, setValues, errors, values, isValid }) => (
          <Form>
            <FormField errorMessage={errors.citizenId} label={t("citizen")}>
              <InputSuggestions<NameSearchResult>
                onSuggestionPress={(suggestion) => {
                  const newValues = {
                    ...values,
                    citizenId: suggestion.id,
                    citizenName: `${suggestion.name} ${suggestion.surname}`,
                  };

                  setValues(newValues, true);
                }}
                Component={({ suggestion }) => (
                  <div className="flex items-center">
                    {suggestion.imageId ? (
                      <Image
                        className="rounded-md w-[35px] h-[35px] object-cover"
                        draggable={false}
                        src={makeImageUrl("citizens", suggestion.imageId)!}
                        loading="lazy"
                        width={35}
                        height={35}
                        alt={`${suggestion.name} ${suggestion.surname}`}
                      />
                    ) : null}
                    <p>
                      {suggestion.name} {suggestion.surname}{" "}
                      {SOCIAL_SECURITY_NUMBERS && suggestion.socialSecurityNumber ? (
                        <>(SSN: {suggestion.socialSecurityNumber})</>
                      ) : null}
                    </p>
                  </div>
                )}
                options={{
                  apiPath: "/search/name",
                  method: "POST",
                  dataKey: "name",
                }}
                inputProps={{
                  value: values.citizenName,
                  name: "citizenName",
                  onChange: handleChange,
                }}
              />
            </FormField>

            <FormField errorMessage={errors.bloodGroup} label={t("bloodGroup")}>
              <Select
                values={bloodGroup.values.map((v) => ({
                  value: v.id,
                  label: v.value,
                }))}
                onChange={handleChange}
                name="bloodGroup"
                value={values.bloodGroup}
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
                onPress={() => closeModal(ModalIds.CreateMedicalRecord)}
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
