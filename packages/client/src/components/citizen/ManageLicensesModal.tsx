import { Formik } from "formik";
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
import { useTranslations } from "use-intl";

export const ManageLicensesModal = () => {
  const { state } = useFetch();
  const { isOpen, closeModal } = useModal();
  const { licenses } = useValues();
  const t = useTranslations("Common");

  async function onSubmit(values: typeof INITIAL_VALUES) {
    console.log({ values });
  }

  const INITIAL_VALUES = {
    driversLicense: "",
  };

  return (
    <Modal
      title="Manage Licenses"
      isOpen={isOpen(ModalIds.ManageLicenses)}
      onClose={() => closeModal(ModalIds.ManageLicenses)}
      className="min-w-[500px]"
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleSubmit, values, errors, isValid, handleChange }) => (
          <form onSubmit={handleSubmit}>
            <FormField fieldId="driversLicense" label={"driversLicense"}>
              <Select
                hasError={!!errors.driversLicense}
                values={licenses.values.map((weapon) => ({
                  label: weapon.value,
                  value: weapon.value,
                }))}
                value={values.driversLicense}
                name="driversLicense"
                onChange={handleChange}
              />
              <Error>{errors.driversLicense}</Error>
            </FormField>

            <FormField fieldId="driversLicense" label={"driversLicense"}>
              <Select
                hasError={!!errors.driversLicense}
                values={licenses.values.map((weapon) => ({
                  label: weapon.value,
                  value: weapon.value,
                }))}
                value={values.driversLicense}
                name="driversLicense"
                onChange={handleChange}
              />
              <Error>{errors.driversLicense}</Error>
            </FormField>
            <FormField fieldId="driversLicense" label={"driversLicense"}>
              <Select
                hasError={!!errors.driversLicense}
                values={licenses.values.map((weapon) => ({
                  label: weapon.value,
                  value: weapon.value,
                }))}
                value={values.driversLicense}
                name="driversLicense"
                onChange={handleChange}
              />
              <Error>{errors.driversLicense}</Error>
            </FormField>
            <FormField fieldId="driversLicense" label={"driversLicense"}>
              <Select
                hasError={!!errors.driversLicense}
                values={licenses.values.map((weapon) => ({
                  label: weapon.value,
                  value: weapon.value,
                }))}
                value={values.driversLicense}
                name="driversLicense"
                onChange={handleChange}
              />
              <Error>{errors.driversLicense}</Error>
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
