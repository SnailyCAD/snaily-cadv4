import { Modal } from "components/modal/Modal";
import { Loader } from "components/Loader";
import useFetch from "lib/useFetch";
import { Citizen, ReleaseType } from "@snailycad/types";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "next-intl";
import { Button } from "components/Button";
import { Formik, FormikHelpers } from "formik";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useImageUrl } from "hooks/useImageUrl";
import { InputSuggestions } from "components/form/inputs/InputSuggestions";

interface Props {
  citizen: (Citizen & { recordId: string }) | null;
  onSuccess(): void;
}

const LABELS = {
  [ReleaseType.TIME_OUT]: "Time Out",
  [ReleaseType.BAIL_POSTED]: "Bail Posted",
};

const TYPES = Object.keys(ReleaseType).map((key) => ({
  value: key,
  label: LABELS[key as ReleaseType],
}));

export function ReleaseCitizenModal({ onSuccess, citizen }: Props) {
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { SOCIAL_SECURITY_NUMBERS } = useFeatureEnabled();
  const { makeImageUrl } = useImageUrl();

  const { isOpen, closeModal } = useModal();
  const { state, execute } = useFetch();

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    if (!citizen) return;

    const { json } = await execute(`/leo/jail/${citizen.id}`, {
      method: "DELETE",
      data: { ...values, recordId: citizen.recordId },
      helpers,
    });

    if (typeof json === "boolean") {
      onSuccess();
    }
  }

  const INITIAL_VALUES = {
    type: "",
    releasedById: "",
    releasedByName: "",
  };

  return (
    <Modal
      title={t("release")}
      onClose={() => closeModal(ModalIds.AlertReleaseCitizen)}
      isOpen={isOpen(ModalIds.AlertReleaseCitizen)}
      className="w-[650px]"
    >
      <p className="my-3">{t("releaseCitizen")}</p>

      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleSubmit, handleChange, setValues, errors, values, isValid }) => (
          <form onSubmit={handleSubmit}>
            <FormField errorMessage={errors.type} label={common("type")}>
              <Select values={TYPES} value={values.type} name="type" onChange={handleChange} />
            </FormField>

            {values.type === ReleaseType.BAIL_POSTED ? (
              <FormField errorMessage={errors.releasedById} label={t("bailPostedBy")}>
                <InputSuggestions
                  onSuggestionClick={(suggestion: Citizen) => {
                    setValues({
                      ...values,
                      releasedById: suggestion.id,
                      releasedByName: `${suggestion.name} ${suggestion.surname}`,
                    });
                  }}
                  Component={({ suggestion }: { suggestion: Citizen }) => (
                    <div className="flex items-center">
                      {suggestion.imageId ? (
                        <img
                          className="rounded-md w-[30px] h-[30px] object-cover mr-2"
                          draggable={false}
                          src={makeImageUrl("citizens", suggestion.imageId)}
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
                    value: values.releasedByName,
                    name: "releasedByName",
                    onChange: handleChange,
                  }}
                />
              </FormField>
            ) : null}

            <footer className="flex justify-end mt-5">
              <Button
                type="reset"
                onClick={() => closeModal(ModalIds.AlertReleaseCitizen)}
                variant="cancel"
              >
                Cancel
              </Button>
              <Button
                className="flex items-center"
                disabled={!isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {t("release")}
              </Button>
            </footer>
          </form>
        )}
      </Formik>
    </Modal>
  );
}
