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
import { useCitizen } from "context/CitizenContext";

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

  const { citizens } = useCitizen();
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
    releasedBy: "",
  };

  return (
    <Modal
      title={t("release")}
      onClose={() => closeModal(ModalIds.AlertReleaseCitizen)}
      isOpen={isOpen(ModalIds.AlertReleaseCitizen)}
      className="min-w-[750px]"
    >
      <p className="my-3">{t("releaseCitizen")}</p>

      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleSubmit, handleChange, errors, values, isValid }) => (
          <form onSubmit={handleSubmit}>
            <FormField errorMessage={errors.type} label={common("type")}>
              <Select values={TYPES} value={values.type} name="type" onChange={handleChange} />
            </FormField>

            {values.type === ReleaseType.BAIL_POSTED ? (
              <FormField errorMessage={errors.releasedBy} label={t("bailPostedBy")}>
                <Select
                  values={citizens.map((citizen) => ({
                    label: `${citizen.name} ${citizen.surname}`,
                    value: citizen.id,
                  }))}
                  value={values.releasedBy}
                  name="releasedBy"
                  onChange={handleChange}
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
