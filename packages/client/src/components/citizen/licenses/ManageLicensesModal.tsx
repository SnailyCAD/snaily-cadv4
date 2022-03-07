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
import { Loader } from "components/Loader";
import { handleValidate } from "lib/handleValidate";
import { FormRow } from "components/form/FormRow";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { filterLicenseTypes } from "lib/utils";
import { Citizen, DriversLicenseCategoryType, ValueLicenseType } from "@snailycad/types";

interface Props {
  onSubmit(values: any): Promise<void>;
  citizen: Citizen;
  state: "loading" | "error" | null;
}

export function ManageLicensesModal({ state, citizen, onSubmit }: Props) {
  const { isOpen, closeModal } = useModal();
  const { license, driverslicenseCategory } = useValues();
  const common = useTranslations("Common");
  const t = useTranslations("Citizen");
  const { WEAPON_REGISTRATION } = useFeatureEnabled();

  const validate = handleValidate(LICENSE_SCHEMA);
  const INITIAL_VALUES = {
    driversLicense: citizen.driversLicenseId ?? null,
    pilotLicense: citizen.pilotLicenseId ?? null,
    weaponLicense: citizen.weaponLicenseId ?? null,
    waterLicense: citizen.waterLicenseId ?? null,
    ccw: citizen.ccwId ?? null,
    driversLicenseCategory: citizen.dlCategory
      .filter((v) => v.type === DriversLicenseCategoryType.AUTOMOTIVE)
      .map((v) => ({
        value: v.id,
        label: v.value.value,
      })),
    pilotLicenseCategory: citizen.dlCategory
      .filter((v) => v.type === DriversLicenseCategoryType.AVIATION)
      .map((v) => ({
        value: v.id,
        label: v.value.value,
      })),
    waterLicenseCategory: citizen.dlCategory
      .filter((v) => v.type === DriversLicenseCategoryType.WATER)
      .map((v) => ({
        value: v.id,
        label: v.value.value,
      })),
  };

  return (
    <Modal
      title={t("manageLicenses")}
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
                  isClearable
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
                    .filter((v) => v.type === DriversLicenseCategoryType.AUTOMOTIVE)
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
                  isClearable
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
                    .filter((v) => v.type === DriversLicenseCategoryType.AVIATION)
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

            <FormRow>
              <FormField errorMessage={errors.waterLicense} label={t("waterLicense")}>
                <Select
                  isClearable
                  values={filterLicenseTypes(license.values, ValueLicenseType.LICENSE).map(
                    (license) => ({
                      label: license.value,
                      value: license.id,
                    }),
                  )}
                  value={values.waterLicense}
                  name="waterLicense"
                  onChange={handleChange}
                />
              </FormField>

              <FormField
                errorMessage={errors.waterLicenseCategory as string}
                label={t("waterLicenseCategory")}
              >
                <Select
                  isMulti
                  values={driverslicenseCategory.values
                    .filter((v) => v.type === DriversLicenseCategoryType.WATER)
                    .map((category) => ({
                      label: category.value.value,
                      value: category.id,
                    }))}
                  value={values.waterLicenseCategory}
                  name="waterLicenseCategory"
                  onChange={handleChange}
                />
              </FormField>
            </FormRow>

            {WEAPON_REGISTRATION ? (
              <>
                <FormField errorMessage={errors.weaponLicense} label={t("weaponLicense")}>
                  <Select
                    isClearable
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
                    isClearable
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
