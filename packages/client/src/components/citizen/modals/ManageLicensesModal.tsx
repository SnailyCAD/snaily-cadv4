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

export const ManageLicensesModal = () => {
  const { state, execute } = useFetch();
  const { isOpen, closeModal } = useModal();
  const { licenses } = useValues();
  const t = useTranslations("Common");
  const { citizen, setCurrentCitizen } = useCitizen();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute(`/licenses/${citizen!.id}`, {
      method: "PUT",
      data: values,
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
  };

  return (
    <Modal
      title="Manage Licenses"
      isOpen={isOpen(ModalIds.ManageLicenses)}
      onClose={() => closeModal(ModalIds.ManageLicenses)}
      className="min-w-[500px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleSubmit, values, errors, isValid, handleChange }) => (
          <form onSubmit={handleSubmit}>
            <FormField fieldId="driversLicense" label={"driversLicense"}>
              <Select
                hasError={!!errors.driversLicense}
                values={licenses.values.map((license) => ({
                  label: license.value,
                  value: license.id,
                }))}
                value={values.driversLicense}
                name="driversLicense"
                onChange={handleChange}
              />
              <Error>{errors.driversLicense}</Error>
            </FormField>

            <FormField fieldId="weaponLicense" label={"weaponLicense"}>
              <Select
                hasError={!!errors.weaponLicense}
                values={licenses.values.map((license) => ({
                  label: license.value,
                  value: license.id,
                }))}
                value={values.weaponLicense}
                name="weaponLicense"
                onChange={handleChange}
              />
              <Error>{errors.weaponLicense}</Error>
            </FormField>
            <FormField fieldId="pilotLicense" label={"pilotLicense"}>
              <Select
                hasError={!!errors.pilotLicense}
                values={licenses.values.map((license) => ({
                  label: license.value,
                  value: license.id,
                }))}
                value={values.pilotLicense}
                name="pilotLicense"
                onChange={handleChange}
              />
              <Error>{errors.pilotLicense}</Error>
            </FormField>
            <FormField fieldId="ccw" label={"ccw"}>
              <Select
                hasError={!!errors.ccw}
                values={licenses.values.map((license) => ({
                  label: license.value,
                  value: license.id,
                }))}
                value={values.ccw}
                name="ccw"
                onChange={handleChange}
              />
              <Error>{errors.ccw}</Error>
            </FormField>

            <footer className="mt-5 flex justify-end">
              <Button
                type="reset"
                onClick={() => closeModal(ModalIds.ManageLicenses)}
                variant="cancel"
              >
                {t("cancel")}
              </Button>
              <Button
                className="flex items-center"
                disabled={!isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {t("save")}
              </Button>
            </footer>
          </form>
        )}
      </Formik>
    </Modal>
  );
};
