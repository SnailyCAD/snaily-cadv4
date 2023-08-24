import type { Value } from "@snailycad/types";
import { Button, SelectField } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { useValues } from "context/ValuesContext";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { useVehicleSearch } from "state/search/vehicle-search-state";
import { ModalIds } from "types/modal-ids";
import { useNameSearch } from "state/search/name-search-state";
import type { PutSearchActionsVehicleFlagsData } from "@snailycad/types/api";
import { hasSearchResults } from "../VehicleSearchModal";

export function ManageVehicleFlagsModal() {
  const modalState = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const veh = useTranslations("Vehicles");
  const { currentResult, setCurrentResult } = useVehicleSearch();
  const nameSearchState = useNameSearch((state) => ({
    currentResult: state.currentResult,
    setCurrentResult: state.setCurrentResult,
  }));
  const { vehicleFlag } = useValues();
  const { state, execute } = useFetch();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!hasSearchResults(currentResult)) return;

    const { json } = await execute<PutSearchActionsVehicleFlagsData>({
      path: `/search/actions/vehicle-flags/${currentResult.id}`,
      method: "PUT",
      data: { flags: values.flags.map((v) => v) },
    });

    if (json.flags) {
      const updatedVehicle = { ...currentResult, ...json };
      setCurrentResult(updatedVehicle);
      modalState.closeModal(ModalIds.ManageVehicleFlags);

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

  function makeValueOption(v: Value) {
    return { label: v.value, value: v.id };
  }

  if (!hasSearchResults(currentResult)) {
    return null;
  }

  const INITIAL_VALUES = {
    flags: currentResult.flags?.map((v) => v.id) ?? [],
  };

  return (
    <Modal
      title={t("manageVehicleFlags")}
      isOpen={modalState.isOpen(ModalIds.ManageVehicleFlags)}
      onClose={() => modalState.closeModal(ModalIds.ManageVehicleFlags)}
      className="w-[600px]"
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ setFieldValue, values, errors, isValid }) => (
          <Form autoComplete="off">
            <SelectField
              errorMessage={errors.flags as string}
              label={veh("flags")}
              selectionMode="multiple"
              options={vehicleFlag.values.map(makeValueOption)}
              selectedKeys={values.flags}
              onSelectionChange={(keys) => setFieldValue("flags", keys)}
            />

            <footer className="flex justify-end mt-5">
              <Button
                disabled={state === "loading"}
                type="reset"
                onPress={() => modalState.closeModal(ModalIds.ManageVehicleFlags)}
                variant="cancel"
              >
                {common("cancel")}
              </Button>
              <Button className="flex items-center" disabled={!isValid} type="submit">
                {common("save")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
