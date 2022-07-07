import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { useValues } from "context/ValuesContext";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { filterLicenseTypes } from "lib/utils";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { ValueLicenseType } from "@snailycad/types";
import { useVehicleSearch } from "state/search/vehicleSearchState";
import { useVehicleLicenses } from "hooks/locale/useVehicleLicenses";
import { useNameSearch } from "state/search/nameSearchState";
import type { PutSearchActionsVehicleLicensesData } from "@snailycad/types/api";

export function ManageVehicleLicensesModal() {
  const common = useTranslations("Common");
  const { isOpen, closeModal } = useModal();
  const { license } = useValues();
  const { currentResult, setCurrentResult } = useVehicleSearch();
  const nameSearchState = useNameSearch();
  const { state, execute } = useFetch();

  const t = useTranslations();
  const { INSPECTION_STATUS, TAX_STATUS } = useVehicleLicenses();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!currentResult) return;

    const { json } = await execute<PutSearchActionsVehicleLicensesData>({
      path: `/search/actions/vehicle-licenses/${currentResult.id}`,
      method: "PUT",
      data: values,
    });

    if (json) {
      const updatedVehicle = { ...currentResult, ...json };

      setCurrentResult(updatedVehicle);
      closeModal(ModalIds.ManageVehicleLicenses);

      if (nameSearchState.currentResult && !nameSearchState.currentResult.isConfidential) {
        nameSearchState.setCurrentResult({
          ...nameSearchState.currentResult,
          vehicles: nameSearchState.currentResult.vehicles.map((v) =>
            v.id === updatedVehicle.id ? updatedVehicle : v,
          ),
        });
      }
    }
  }

  if (!currentResult) {
    return null;
  }

  const INITIAL_VALUES = {
    insuranceStatus: currentResult.insuranceStatusId ?? null,
    inspectionStatus: currentResult.inspectionStatus ?? null,
    taxStatus: currentResult.taxStatus ?? null,
    registrationStatus: currentResult.registrationStatusId ?? "",
  };

  return (
    <Modal
      title={t("Leo.editLicenses")}
      isOpen={isOpen(ModalIds.ManageVehicleLicenses)}
      onClose={() => closeModal(ModalIds.ManageVehicleLicenses)}
      className="min-w-[600px]"
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, errors, values }) => (
          <Form>
            <FormField
              errorMessage={errors.registrationStatus}
              label={t("Vehicles.registrationStatus")}
            >
              <Select
                values={filterLicenseTypes(
                  license.values,
                  ValueLicenseType.REGISTRATION_STATUS,
                ).map((license) => ({
                  label: license.value,
                  value: license.id,
                }))}
                value={values.registrationStatus}
                name="registrationStatus"
                onChange={handleChange}
              />
            </FormField>

            <FormField errorMessage={errors.insuranceStatus} label={t("Vehicles.insuranceStatus")}>
              <Select
                isClearable
                values={filterLicenseTypes(license.values, ValueLicenseType.INSURANCE_STATUS).map(
                  (license) => ({
                    label: license.value,
                    value: license.id,
                  }),
                )}
                value={values.insuranceStatus}
                name="insuranceStatus"
                onChange={handleChange}
              />
            </FormField>

            <FormField
              errorMessage={errors.inspectionStatus}
              label={t("Vehicles.inspectionStatus")}
            >
              <Select
                isClearable
                values={INSPECTION_STATUS}
                value={values.inspectionStatus}
                name="inspectionStatus"
                onChange={handleChange}
              />
            </FormField>

            <FormField errorMessage={errors.taxStatus} label={t("Vehicles.taxStatus")}>
              <Select
                isClearable
                values={TAX_STATUS}
                value={values.taxStatus}
                name="taxStatus"
                onChange={handleChange}
              />
            </FormField>

            <footer className="flex items-center justify-end gap-2 mt-5">
              <Button
                type="reset"
                onClick={() => closeModal(ModalIds.ManageVehicleLicenses)}
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
