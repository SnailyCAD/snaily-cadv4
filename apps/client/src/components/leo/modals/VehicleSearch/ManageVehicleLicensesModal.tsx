import { Loader, Button, SelectField } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { useValues } from "context/ValuesContext";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { filterLicenseType, filterLicenseTypes } from "lib/utils";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/modal-ids";
import { ValueLicenseType, ValueType } from "@snailycad/types";
import { useVehicleSearch } from "state/search/vehicle-search-state";
import { useVehicleLicenses } from "hooks/locale/useVehicleLicenses";
import { useNameSearch } from "state/search/name-search-state";
import type { PutSearchActionsVehicleLicensesData } from "@snailycad/types/api";
import { ValueSelectField } from "components/form/inputs/value-select-field";
import { hasSearchResults } from "../VehicleSearchModal";

export function ManageVehicleLicensesModal() {
  const common = useTranslations("Common");
  const modalState = useModal();
  const { license } = useValues();
  const { currentResult, setCurrentResult } = useVehicleSearch();
  const nameSearchState = useNameSearch((state) => ({
    currentResult: state.currentResult,
    setCurrentResult: state.setCurrentResult,
  }));
  const { state, execute } = useFetch();

  const t = useTranslations();
  const { INSPECTION_STATUS, TAX_STATUS } = useVehicleLicenses();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!hasSearchResults(currentResult)) return;

    const { json } = await execute<PutSearchActionsVehicleLicensesData>({
      path: `/search/actions/vehicle-licenses/${currentResult.id}`,
      method: "PUT",
      data: values,
    });

    if (json) {
      const updatedVehicle = { ...currentResult, ...json };

      setCurrentResult(updatedVehicle);
      modalState.closeModal(ModalIds.ManageVehicleLicenses);

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

  if (!hasSearchResults(currentResult)) {
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
      isOpen={modalState.isOpen(ModalIds.ManageVehicleLicenses)}
      onClose={() => modalState.closeModal(ModalIds.ManageVehicleLicenses)}
      className="min-w-[600px]"
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ setFieldValue, errors, values }) => (
          <Form>
            <ValueSelectField
              fieldName="registrationStatus"
              valueType={ValueType.LICENSE}
              values={filterLicenseTypes(license.values, ValueLicenseType.REGISTRATION_STATUS)}
              label={t("Vehicles.registrationStatus")}
              filterFn={(v) => filterLicenseType(v, ValueLicenseType.REGISTRATION_STATUS)}
            />

            <ValueSelectField
              isClearable
              fieldName="insuranceStatus"
              valueType={ValueType.LICENSE}
              values={filterLicenseTypes(license.values, ValueLicenseType.INSURANCE_STATUS)}
              label={t("Vehicles.insuranceStatus")}
              filterFn={(v) => filterLicenseType(v, ValueLicenseType.INSURANCE_STATUS)}
            />

            <SelectField
              isOptional
              errorMessage={errors.inspectionStatus}
              label={t("Vehicles.inspectionStatus")}
              name="inspectionStatus"
              options={INSPECTION_STATUS}
              onSelectionChange={(key) => setFieldValue("inspectionStatus", key)}
              isClearable
              selectedKey={values.inspectionStatus}
            />

            <SelectField
              isOptional
              errorMessage={errors.taxStatus}
              label={t("Vehicles.taxStatus")}
              name="taxStatus"
              options={TAX_STATUS}
              onSelectionChange={(key) => setFieldValue("taxStatus", key)}
              isClearable
              selectedKey={values.taxStatus}
            />

            <footer className="flex items-center justify-end gap-2 mt-5">
              <Button
                type="reset"
                onPress={() => modalState.closeModal(ModalIds.ManageVehicleLicenses)}
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
