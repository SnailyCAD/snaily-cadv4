import { Loader, Button } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { useValues } from "context/ValuesContext";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/modal-ids";
import { useVehicleSearch } from "state/search/vehicle-search-state";
import { useNameSearch } from "state/search/name-search-state";
import type { PostSearchActionsCreateVehicle } from "@snailycad/types/api";
import { handleValidate } from "lib/handleValidate";
import { IMPOUND_VEHICLE_SCHEMA } from "@snailycad/schemas";
import { shallow } from "zustand/shallow";
import { ValueSelectField } from "components/form/inputs/value-select-field";
import { ValueType } from "@snailycad/types";

export function ImpoundVehicleModal() {
  const common = useTranslations("Common");
  const { isOpen, closeModal } = useModal();
  const { impoundLot } = useValues();
  const { currentResult, setCurrentResult } = useVehicleSearch();
  const nameSearchState = useNameSearch(
    (state) => ({
      currentResult: state.currentResult,
      setCurrentResult: state.setCurrentResult,
    }),
    shallow,
  );
  const { state, execute } = useFetch();

  const t = useTranslations();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    if (!currentResult) return;

    const { json } = await execute<PostSearchActionsCreateVehicle>({
      path: `/search/actions/impound/${currentResult.id}`,
      method: "POST",
      data: values,
    });

    if (json) {
      const updatedVehicle = { ...currentResult, impounded: true };

      setCurrentResult(updatedVehicle);
      closeModal(ModalIds.ImpoundVehicle);

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

  const validate = handleValidate(IMPOUND_VEHICLE_SCHEMA);
  const INITIAL_VALUES = {
    impoundLot: "",
  };

  return (
    <Modal
      title={t("Leo.impoundVehicle")}
      isOpen={isOpen(ModalIds.ImpoundVehicle)}
      onClose={() => closeModal(ModalIds.ImpoundVehicle)}
      className="min-w-[600px]"
    >
      <Formik validate={validate} onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
        <Form>
          <ValueSelectField
            fieldName="impoundLot"
            label={t("Leo.impoundLot")}
            values={impoundLot.values}
            valueType={ValueType.IMPOUND_LOT}
          />

          <footer className="flex items-center justify-end gap-2 mt-5">
            <Button
              type="reset"
              onPress={() => closeModal(ModalIds.ImpoundVehicle)}
              variant="cancel"
            >
              {common("cancel")}
            </Button>
            <Button className="flex items-center" disabled={state === "loading"} type="submit">
              {state === "loading" ? <Loader className="mr-2" /> : null}
              {t("Leo.impoundVehicle")}
            </Button>
          </footer>
        </Form>
      </Formik>
    </Modal>
  );
}
