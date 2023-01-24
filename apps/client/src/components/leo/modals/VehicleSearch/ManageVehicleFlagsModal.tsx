import type { Value } from "@snailycad/types";
import { Button } from "@snailycad/ui";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { useValues } from "context/ValuesContext";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { useVehicleSearch } from "state/search/vehicle-search-state";
import { ModalIds } from "types/ModalIds";
import { useNameSearch } from "state/search/name-search-state";
import type { PutSearchActionsVehicleFlagsData } from "@snailycad/types/api";
import { shallow } from "zustand/shallow";

export function ManageVehicleFlagsModal() {
  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const veh = useTranslations("Vehicles");
  const { currentResult, setCurrentResult } = useVehicleSearch();
  const nameSearchState = useNameSearch(
    (state) => ({
      currentResult: state.currentResult,
      setCurrentResult: state.setCurrentResult,
    }),
    shallow,
  );
  const { vehicleFlag } = useValues();
  const { state, execute } = useFetch();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!currentResult) return;

    const { json } = await execute<PutSearchActionsVehicleFlagsData>({
      path: `/search/actions/vehicle-flags/${currentResult.id}`,
      method: "PUT",
      data: { flags: values.flags.map((v) => v.value) },
    });

    if (json.flags) {
      const updatedVehicle = { ...currentResult, ...json };
      setCurrentResult(updatedVehicle);
      closeModal(ModalIds.ManageVehicleFlags);

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

  if (!currentResult) {
    return null;
  }

  const INITIAL_VALUES = {
    flags: currentResult.flags?.map(makeValueOption) ?? [],
  };

  return (
    <Modal
      title={t("manageVehicleFlags")}
      isOpen={isOpen(ModalIds.ManageVehicleFlags)}
      onClose={() => closeModal(ModalIds.ManageVehicleFlags)}
      className="w-[600px]"
    >
      <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        {({ handleChange, values, errors, isValid }) => (
          <Form autoComplete="off">
            <FormField errorMessage={errors.flags as string} label={veh("flags")}>
              <Select
                isMulti
                values={vehicleFlag.values.map(makeValueOption)}
                name="flags"
                onChange={handleChange}
                value={values.flags}
              />
            </FormField>

            <footer className="flex justify-end mt-5">
              <Button
                disabled={state === "loading"}
                type="reset"
                onPress={() => closeModal(ModalIds.ManageVehicleFlags)}
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
