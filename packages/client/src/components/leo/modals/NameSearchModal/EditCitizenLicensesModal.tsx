import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { useValues } from "context/ValuesContext";
import { Form, Formik } from "formik";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import useFetch from "lib/useFetch";
import { filterLicenseTypes } from "lib/utils";
import { useTranslations } from "next-intl";
import { useNameSearch } from "state/nameSearchState";
import { ModalIds } from "types/ModalIds";
import { ValueLicenseType } from "@snailycad/types";

export function EditCitizenLicenses() {
  const common = useTranslations("Common");
  const { isOpen, closeModal } = useModal();
  const { license } = useValues();
  const { currentResult, setCurrentResult } = useNameSearch();
  const { state, execute } = useFetch();
  const t = useTranslations();
  const { WEAPON_REGISTRATION } = useFeatureEnabled();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!currentResult) return;

    const { json } = await execute(`/leo/licenses/${currentResult.id}`, {
      method: "PUT",
      data: values,
    });

    if (json) {
      setCurrentResult({ ...currentResult, ...json });
      closeModal(ModalIds.EditCitizenLicenses);
    }
  }

  const INITIAL_VALUES = {
    driversLicense: currentResult?.driversLicenseId ?? "",
    pilotLicense: currentResult?.pilotLicenseId ?? "",
    weaponLicense: currentResult?.weaponLicenseId ?? "",
    ccw: currentResult?.ccwId ?? "",
  };

  return (
    <Modal
      title={t("Leo.editLicenses")}
      isOpen={isOpen(ModalIds.EditCitizenLicenses)}
      onClose={() => closeModal(ModalIds.EditCitizenLicenses)}
      className="min-w-[600px]"
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, errors, values }) => (
          <Form>
            <FormField errorMessage={errors.driversLicense} label={t("Citizen.driversLicense")}>
              <Select
                values={filterLicenseTypes(license.values, ValueLicenseType.LICENSE).map(
                  (license) => ({
                    label: license.value,
                    value: license.id,
                  }),
                )}
                value={values.driversLicense}
                onChange={handleChange}
                name="driversLicense"
              />
            </FormField>

            <FormField errorMessage={errors.pilotLicense} label={t("Citizen.pilotLicense")}>
              <Select
                values={filterLicenseTypes(license.values, ValueLicenseType.LICENSE).map(
                  (license) => ({
                    label: license.value,
                    value: license.id,
                  }),
                )}
                value={values.pilotLicense}
                onChange={handleChange}
                name="pilotLicense"
              />
            </FormField>

            {WEAPON_REGISTRATION ? (
              <>
                <FormField errorMessage={errors.weaponLicense} label={t("Citizen.weaponLicense")}>
                  <Select
                    values={filterLicenseTypes(license.values, ValueLicenseType.LICENSE).map(
                      (license) => ({
                        label: license.value,
                        value: license.id,
                      }),
                    )}
                    value={values.weaponLicense}
                    onChange={handleChange}
                    name="weaponLicense"
                  />
                </FormField>

                <FormField errorMessage={errors.ccw} label={t("Citizen.ccw")}>
                  <Select
                    values={filterLicenseTypes(license.values, ValueLicenseType.LICENSE).map(
                      (license) => ({
                        label: license.value,
                        value: license.id,
                      }),
                    )}
                    value={values.ccw}
                    onChange={handleChange}
                    name="ccw"
                  />
                </FormField>
              </>
            ) : null}

            <footer className="flex items-center justify-end gap-2 mt-5">
              <Button
                type="reset"
                onClick={() => closeModal(ModalIds.EditCitizenLicenses)}
                variant="cancel"
              >
                {common("cancel")}
              </Button>
              <Button className="flex items-center" disabled={state === "loading"} type="submit">
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
