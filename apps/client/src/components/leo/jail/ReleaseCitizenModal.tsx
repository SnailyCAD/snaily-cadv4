import { Modal } from "components/modal/Modal";
import { Button, Loader, SelectField } from "@snailycad/ui";
import useFetch from "lib/useFetch";
import { BaseCitizen, Record, ReleaseType } from "@snailycad/types";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "next-intl";
import { Form, Formik, FormikHelpers } from "formik";
import type { DeleteReleaseJailedCitizenData } from "@snailycad/types/api";
import { CitizenSuggestionsField } from "components/shared/CitizenSuggestionsField";

interface Props {
  citizen: (BaseCitizen & { recordId: string }) | null;
  onSuccess(entry: BaseCitizen & { Record: Record[] }): void;
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

  const { isOpen, closeModal } = useModal();
  const { state, execute } = useFetch();

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    if (!citizen) return;

    const { json } = await execute<DeleteReleaseJailedCitizenData, typeof INITIAL_VALUES>({
      path: `/leo/jail/${citizen.id}`,
      method: "DELETE",
      data: { ...values, recordId: citizen.recordId },
      helpers,
    });

    if (json) {
      onSuccess(json);
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
        {({ setFieldValue, errors, values, isValid }) => (
          <Form>
            <SelectField
              label={common("type")}
              errorMessage={errors.type}
              name="type"
              options={TYPES}
              selectedKey={values.type}
              onSelectionChange={(key) => setFieldValue("type", key)}
            />

            {values.type === ReleaseType.BAIL_POSTED ? (
              <CitizenSuggestionsField
                allowsCustomValue
                autoFocus
                label={t("bailPostedBy")}
                fromAuthUserOnly
                labelFieldName="releasedByName"
                valueFieldName="releasedById"
              />
            ) : null}

            <footer className="flex justify-end mt-5">
              <Button
                type="reset"
                onPress={() => closeModal(ModalIds.AlertReleaseCitizen)}
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
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
