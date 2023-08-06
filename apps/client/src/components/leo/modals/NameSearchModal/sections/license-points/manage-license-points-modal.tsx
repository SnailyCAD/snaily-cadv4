import { Form, Formik } from "formik";
import { useTranslations } from "use-intl";
import { LICENSE_POINTS_SCHEMA } from "@snailycad/schemas";
import { useModal } from "state/modalState";
import { Modal } from "components/modal/Modal";
import { ModalIds } from "types/modal-ids";
import { Button, Loader, TextField } from "@snailycad/ui";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { useNameSearch } from "state/search/name-search-state";
import { PutSearchActionsLicensePointsData } from "@snailycad/types/api";
import { toastMessage } from "lib/toastMessage";

export function ManageLicensePointsModal() {
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations();
  const { state, execute } = useFetch();
  const { currentResult, setCurrentResult } = useNameSearch((state) => ({
    currentResult: state.currentResult,
    setCurrentResult: state.setCurrentResult,
  }));

  if (!currentResult || currentResult.isConfidential) {
    return null;
  }

  const validate = handleValidate(LICENSE_POINTS_SCHEMA);
  const INITIAL_VALUES = {
    driverLicensePoints: currentResult.licensePoints?.driverLicensePoints ?? 0,
    pilotLicensePoints: currentResult.licensePoints?.pilotLicensePoints ?? 0,
    waterLicensePoints: currentResult.licensePoints?.waterLicensePoints ?? 0,
    firearmsLicensePoints: currentResult.licensePoints?.firearmsLicensePoints ?? 0,
  };

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!currentResult) return;

    const { json } = await execute<PutSearchActionsLicensePointsData>({
      path: `/search/actions/license-points/${currentResult.id}`,
      method: "PUT",
      data: values,
    });

    if (json) {
      setCurrentResult({ ...currentResult, ...json });
      closeModal(ModalIds.ManageLicensePoints);

      toastMessage({
        icon: "success",
        title: t("Leo.editLicensePoints"),
        message: t("Leo.editLicensePointsSuccess"),
      });
    }
  }

  const keys = Object.keys(INITIAL_VALUES) as (keyof typeof INITIAL_VALUES)[];
  return (
    <Modal
      title={t("Leo.editLicensePoints")}
      isOpen={isOpen(ModalIds.ManageLicensePoints)}
      onClose={() => closeModal(ModalIds.ManageLicensePoints)}
      className="w-[750px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ isValid, values, setFieldValue }) => (
          <Form>
            {keys.map((key) => {
              return (
                <TextField
                  type="number"
                  inputMode="numeric"
                  label={t(`Citizen.${key}`)}
                  key={key}
                  value={values[key].toString()}
                  onChange={(value) => setFieldValue(key, parseInt(value, 10))}
                />
              );
            })}

            <footer className="flex justify-end mt-5">
              <Button
                type="reset"
                onPress={() => closeModal(ModalIds.ManageLicensePoints)}
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
                {common("save")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
