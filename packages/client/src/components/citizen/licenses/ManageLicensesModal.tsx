import { Formik } from "formik";
import { useTranslations } from "use-intl";
import { LICENSE_SCHEMA } from "@snailycad/schemas";
import { useModal } from "context/ModalContext";
import { Modal } from "components/modal/Modal";
import { ModalIds } from "types/ModalIds";
import { FormField } from "components/form/FormField";
import { useValues } from "context/ValuesContext";
import { Select } from "components/form/Select";
import { Button } from "components/Button";
import useFetch from "lib/useFetch";
import { Loader } from "components/Loader";
import { handleValidate } from "lib/handleValidate";
import { useCitizen } from "context/CitizenContext";
import { FormRow } from "components/form/FormRow";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { filterLicenseTypes } from "lib/utils";
import { ValueLicenseType } from "@snailycad/types";

export function ManageLicensesModal() {
  const { state, execute } = useFetch();
  const { isOpen, closeModal } = useModal();
  const { license, driverslicenseCategory } = useValues();
  const common = useTranslations("Common");
  const t = useTranslations("Citizen");
  const { citizen, setCurrentCitizen } = useCitizen(false);
  const { WEAPON_REGISTRATION } = useFeatureEnabled();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute(`/licenses/${citizen.id}`, {
      method: "PUT",
      data: {
        ...values,
        driversLicenseCategory: values.driversLicenseCategory.map((v) => v.value),
        pilotLicenseCategory: values.pilotLicenseCategory.map((v) => v.value),
      },
    });

    if (json?.id) {
      setCurrentCitizen({ ...citizen, ...json });
      closeModal(ModalIds.ManageLicenses);
    }
  }

  if (!citizen) {
    return null;
  }

  const validate = handleValidate(LICENSE_SCHEMA);
  const INITIAL_VALUES = {
    driversLicense: citizen.driversLicenseId ?? "",
    pilotLicense: citizen.pilotLicenseId ?? "",
    weaponLicense: citizen.weaponLicenseId ?? "",
    ccw: citizen.ccwId ?? "",
    driversLicenseCategory: citizen.dlCategory
      .filter((v) => v.type === "AUTOMOTIVE")
      .map((v) => ({
        value: v.id,
        label: v.value.value,
      })),
    pilotLicenseCategory: citizen.dlCategory
      .filter((v) => v.type === "AVIATION")
      .map((v) => ({
        value: v.id,
        label: v.value.value,
      })),
  };

  return (
    <Modal
      title="Manage Licenses"
      isOpen={isOpen(ModalIds.ManageLicenses)}
      onClose={() => closeModal(ModalIds.ManageLicenses)}
      className="w-[750px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleSubmit, values, errors, isValid, handleChange }) => (
          <form onSubmit={handleSubmit}>
            <FormRow>
              <FormField errorMessage={errors.driversLicense} label={t("driversLicense")}>
                <Select
                  values={filterLicenseTypes(license.values, ValueLicenseType.LICENSE).map(
                    (license) => ({
                      label: license.value,
                      value: license.id,
                    }),
                  )}
                  value={values.driversLicense}
                  name="driversLicense"
                  onChange={handleChange}
                />
              </FormField>

              <FormField
                errorMessage={errors.driversLicenseCategory as string}
                label={t("driversLicenseCategory")}
              >
                <Select
                  isMulti
                  values={driverslicenseCategory.values
                    .filter((v) => v.type === "AUTOMOTIVE")
                    .map((category) => ({
                      label: category.value.value,
                      value: category.id,
                    }))}
                  value={values.driversLicenseCategory}
                  name="driversLicenseCategory"
                  onChange={handleChange}
                />
              </FormField>
            </FormRow>

            <FormRow>
              <FormField errorMessage={errors.pilotLicense} label={t("pilotLicense")}>
                <Select
                  values={filterLicenseTypes(license.values, ValueLicenseType.LICENSE).map(
                    (license) => ({
                      label: license.value,
                      value: license.id,
                    }),
                  )}
                  value={values.pilotLicense}
                  name="pilotLicense"
                  onChange={handleChange}
                />
              </FormField>

              <FormField
                errorMessage={errors.pilotLicenseCategory as string}
                label={t("pilotLicenseCategory")}
              >
                <Select
                  isMulti
                  values={driverslicenseCategory.values
                    .filter((v) => v.type === "AVIATION")
                    .map((category) => ({
                      label: category.value.value,
                      value: category.id,
                    }))}
                  value={values.pilotLicenseCategory}
                  name="pilotLicenseCategory"
                  onChange={handleChange}
                />
              </FormField>
            </FormRow>

            {WEAPON_REGISTRATION ? (
              <>
                <FormField errorMessage={errors.weaponLicense} label={t("weaponLicense")}>
                  <Select
                    values={filterLicenseTypes(license.values, ValueLicenseType.LICENSE).map(
                      (license) => ({
                        label: license.value,
                        value: license.id,
                      }),
                    )}
                    value={values.weaponLicense}
                    name="weaponLicense"
                    onChange={handleChange}
                  />
                </FormField>

                <FormField errorMessage={errors.ccw} label={t("ccw")}>
                  <Select
                    values={filterLicenseTypes(license.values, ValueLicenseType.LICENSE).map(
                      (license) => ({
                        label: license.value,
                        value: license.id,
                      }),
                    )}
                    value={values.ccw}
                    name="ccw"
                    onChange={handleChange}
                  />
                </FormField>
              </>
            ) : null}

            <footer className="flex justify-end mt-5">
              <Button
                type="reset"
                onClick={() => closeModal(ModalIds.ManageLicenses)}
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
          </form>
        )}
      </Formik>
    </Modal>
  );
}
