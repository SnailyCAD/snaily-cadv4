import { Formik } from "formik";
import { useTranslations } from "use-intl";
import { LICENSE_SCHEMA } from "@snailycad/schemas";
import { useModal } from "context/ModalContext";
import { Modal } from "components/modal/Modal";
import { ModalIds } from "types/ModalIds";
import { FormField } from "components/form/FormField";
import { useValues } from "context/ValuesContext";
import { Select } from "components/form/Select";
import { Error } from "components/form/Error";
import { Button } from "components/Button";
import useFetch from "lib/useFetch";
import { Loader } from "components/Loader";
import { handleValidate } from "lib/handleValidate";
import { useCitizen } from "context/CitizenContext";
import { FormRow } from "components/form/FormRow";

export function ManageLicensesModal() {
  const { state, execute } = useFetch();
  const { isOpen, closeModal } = useModal();
  const { license, driverslicenseCategory } = useValues();
  const common = useTranslations("Common");
  const t = useTranslations("Citizen");
  const { citizen, setCurrentCitizen } = useCitizen();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute(`/licenses/${citizen!.id}`, {
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
              <FormField label={t("driversLicense")}>
                <Select
                  hasError={!!errors.driversLicense}
                  values={license.values.map((license) => ({
                    label: license.value,
                    value: license.id,
                  }))}
                  value={values.driversLicense}
                  name="driversLicense"
                  onChange={handleChange}
                />
                <Error>{errors.driversLicense}</Error>
              </FormField>

              <FormField label={t("driversLicenseCategory")}>
                <Select
                  isMulti
                  hasError={!!errors.driversLicenseCategory}
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
                <Error>{errors.driversLicenseCategory}</Error>
              </FormField>
            </FormRow>

            <FormRow>
              <FormField label={t("pilotLicense")}>
                <Select
                  hasError={!!errors.pilotLicense}
                  values={license.values.map((license) => ({
                    label: license.value,
                    value: license.id,
                  }))}
                  value={values.pilotLicense}
                  name="pilotLicense"
                  onChange={handleChange}
                />
                <Error>{errors.pilotLicense}</Error>
              </FormField>

              <FormField label={t("pilotLicenseCategory")}>
                <Select
                  isMulti
                  hasError={!!errors.pilotLicenseCategory}
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
                <Error>{errors.pilotLicenseCategory}</Error>
              </FormField>
            </FormRow>

            <FormField label={t("weaponLicense")}>
              <Select
                hasError={!!errors.weaponLicense}
                values={license.values.map((license) => ({
                  label: license.value,
                  value: license.id,
                }))}
                value={values.weaponLicense}
                name="weaponLicense"
                onChange={handleChange}
              />
              <Error>{errors.weaponLicense}</Error>
            </FormField>

            <FormField label={t("ccw")}>
              <Select
                hasError={!!errors.ccw}
                values={license.values.map((license) => ({
                  label: license.value,
                  value: license.id,
                }))}
                value={values.ccw}
                name="ccw"
                onChange={handleChange}
              />
              <Error>{errors.ccw}</Error>
            </FormField>

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
