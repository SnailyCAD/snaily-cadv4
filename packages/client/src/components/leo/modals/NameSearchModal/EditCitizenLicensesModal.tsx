import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { useValues } from "context/ValuesContext";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { useNameSearch } from "state/nameSearchState";
import { ModalIds } from "types/ModalIds";

export function EditCitizenLicenses() {
  const common = useTranslations("Common");
  const { isOpen, closeModal } = useModal();
  const { license } = useValues();
  const { currentResult, setCurrentResult } = useNameSearch();
  const { state, execute } = useFetch();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!currentResult) return;

    const { json } = await execute(`/leo/licenses/${currentResult.id}`, {
      method: "POST",
      data: values,
    });

    if (json) {
      setCurrentResult({ ...currentResult, ...json });
      closeModal(ModalIds.EditCitizenLicenses);
    }
  }

  const INITIAL_VALUES = {
    driversLicenseId: currentResult?.driversLicenseId ?? "",
    pilotLicenseId: currentResult?.pilotLicenseId ?? "",
    weaponLicenseId: currentResult?.weaponLicenseId ?? "",
    ccwId: currentResult?.ccwId ?? "",
  };

  return (
    <Modal
      title="Edit Licenses"
      isOpen={isOpen(ModalIds.EditCitizenLicenses)}
      onClose={() => closeModal(ModalIds.EditCitizenLicenses)}
      className="min-w-[600px]"
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, errors, values }) => (
          <Form>
            <FormField errorMessage={errors.driversLicenseId} label="Drivers license">
              <Select
                values={license.values.map((license) => ({
                  label: license.value,
                  value: license.id,
                }))}
                value={values.driversLicenseId}
                onChange={handleChange}
                name="driversLicenseId"
              />
            </FormField>

            <FormField errorMessage={errors.weaponLicenseId} label="Weapon license">
              <Select
                values={license.values.map((license) => ({
                  label: license.value,
                  value: license.id,
                }))}
                value={values.weaponLicenseId}
                onChange={handleChange}
                name="weaponLicenseId"
              />
            </FormField>

            <FormField errorMessage={errors.pilotLicenseId} label="Pilot license">
              <Select
                values={license.values.map((license) => ({
                  label: license.value,
                  value: license.id,
                }))}
                value={values.pilotLicenseId}
                onChange={handleChange}
                name="pilotLicenseId"
              />
            </FormField>

            <FormField errorMessage={errors.ccwId} label="CCW">
              <Select
                values={license.values.map((license) => ({
                  label: license.value,
                  value: license.id,
                }))}
                value={values.ccwId}
                onChange={handleChange}
                name="ccwId"
              />
            </FormField>

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
