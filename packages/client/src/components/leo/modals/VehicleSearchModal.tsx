import * as React from "react";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { BoloType, CustomFieldCategory, RegisteredVehicle } from "@snailycad/types";
import { useRouter } from "next/router";
import { InputSuggestions } from "components/form/inputs/InputSuggestions";
import { useVehicleSearch, VehicleSearchResult } from "state/search/vehicleSearchState";
import { ManageVehicleFlagsModal } from "./VehicleSearch/ManageVehicleFlagsModal";
import { ManageVehicleLicensesModal } from "./VehicleSearch/ManageVehicleLicensesModal";
import { ManageCustomFieldsModal } from "./NameSearchModal/ManageCustomFieldsModal";
import { useNameSearch } from "state/search/nameSearchState";
import { useBolos } from "hooks/realtime/useBolos";
import { TabList } from "components/shared/TabList";
import { ResultsTab } from "./VehicleSearch/tabs/ResultsTab";
import { NotesTab } from "./NameSearchModal/tabs/NotesTab";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { RegisterVehicleModal } from "components/citizen/vehicles/RegisterVehicleModal";

interface Props {
  id?: ModalIds.VehicleSearch | ModalIds.VehicleSearchWithinName;
}

export function VehicleSearchModal({ id = ModalIds.VehicleSearch }: Props) {
  const { currentResult, setCurrentResult } = useVehicleSearch();
  const nameSearchState = useNameSearch();
  const { bolos } = useBolos();

  const { isOpen, openModal, closeModal } = useModal();
  const common = useTranslations("Common");
  const vT = useTranslations("Vehicles");
  const t = useTranslations("Leo");
  const { state, execute } = useFetch();
  const router = useRouter();
  const { CREATE_USER_CITIZEN_LEO } = useFeatureEnabled();

  const isLeo = router.pathname === "/officer";
  const showMarkStolen = currentResult && isLeo && !currentResult.reportedStolen;

  const bolo = React.useMemo(() => {
    if (!currentResult) return null;
    if (bolos.length <= 0) return null;

    const boloWithPlate = bolos.find(
      (v) =>
        v.type === BoloType.VEHICLE && v.plate?.toUpperCase() === currentResult.plate.toUpperCase(),
    );

    return boloWithPlate ?? null;
  }, [bolos, currentResult]);

  React.useEffect(() => {
    if (!isOpen(id)) {
      setCurrentResult(undefined);
    }
  }, [id, isOpen, setCurrentResult]);

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute("/search/vehicle", {
      method: "POST",
      data: values,
      noToast: true,
    });

    if (json.id) {
      setCurrentResult(json);
    } else {
      setCurrentResult(null);
    }
  }

  function handleEditLicenses() {
    if (!currentResult) return;

    openModal(ModalIds.ManageVehicleLicenses);
  }

  async function handleMarkStolen() {
    if (!currentResult) return;

    const { json } = await execute(`/bolos/mark-stolen/${currentResult.id}`, {
      method: "POST",
      data: {
        id: currentResult.id,
        color: currentResult.color,
        modelId: currentResult.modelId,
        plate: currentResult.plate,
      },
    });

    if (json) {
      const updatedVehicle = { ...currentResult, reportedStolen: true };

      setCurrentResult(updatedVehicle);

      if (nameSearchState.currentResult) {
        nameSearchState.setCurrentResult({
          ...nameSearchState.currentResult,
          vehicles: nameSearchState.currentResult.vehicles.map((v) =>
            v.id === updatedVehicle.id ? updatedVehicle : v,
          ),
        });
      }
    }
  }

  const INITIAL_VALUES = {
    plateOrVin: currentResult?.vinNumber ?? "",
  };

  return (
    <Modal
      title={t("plateSearch")}
      onClose={() => closeModal(id)}
      isOpen={isOpen(id)}
      className="w-[750px]"
    >
      <Formik initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleChange, setFieldValue, errors, values, isValid }) => (
          <Form>
            <FormField errorMessage={errors.plateOrVin} label={t("plateOrVin")}>
              <InputSuggestions<VehicleSearchResult>
                onSuggestionClick={(suggestion) => {
                  setFieldValue("plateOrVin", suggestion.vinNumber);
                  setCurrentResult(suggestion);
                }}
                Component={({ suggestion }) => (
                  <div className="flex items-center">
                    <p>
                      {suggestion.plate.toUpperCase()} ({suggestion.vinNumber})
                    </p>
                  </div>
                )}
                options={{
                  apiPath: "/search/vehicle?includeMany=true",
                  method: "POST",
                  dataKey: "plateOrVin",
                  allowUnknown: true,
                }}
                inputProps={{
                  value: values.plateOrVin,
                  name: "plateOrVin",
                  onChange: handleChange,
                }}
              />
            </FormField>

            {!currentResult ? (
              typeof currentResult === "undefined" ? null : (
                <p>{t("vehicleNotFound")}</p>
              )
            ) : (
              <div className="mt-3">
                <h3 className="text-2xl font-semibold">{t("results")}</h3>

                {currentResult.reportedStolen ? (
                  <div className="p-2 mt-2 font-semibold text-black rounded-md bg-amber-500">
                    {t("vehicleReportedStolen")}
                  </div>
                ) : null}

                {bolo ? (
                  <div className="p-2 mt-2 font-semibold text-black rounded-md bg-amber-500">
                    {t("vehicleBoloPlaced")}
                  </div>
                ) : null}

                <TabList
                  tabs={[
                    { value: "results", name: t("results") },
                    { value: "notes", name: t("notes") },
                  ]}
                >
                  <ResultsTab />
                  <NotesTab
                    type="VEHICLE"
                    currentResult={currentResult}
                    setCurrentResult={setCurrentResult}
                  />
                </TabList>
              </div>
            )}

            <footer className="mt-5 flex justify-between">
              <div className="flex gap-2">
                {CREATE_USER_CITIZEN_LEO && isLeo ? (
                  <Button type="button" onClick={() => openModal(ModalIds.RegisterVehicle)}>
                    {t("createVehicle")}
                  </Button>
                ) : null}

                {showMarkStolen ? (
                  <Button
                    type="button"
                    onClick={() => handleMarkStolen()}
                    variant="cancel"
                    className="px-1.5"
                  >
                    {vT("reportAsStolen")}
                  </Button>
                ) : null}

                {isLeo && currentResult ? (
                  <Button
                    type="button"
                    onClick={() => handleEditLicenses()}
                    variant="cancel"
                    className="px-1.5"
                  >
                    {t("editLicenses")}
                  </Button>
                ) : null}
              </div>

              <div className="flex">
                <Button type="reset" onClick={() => closeModal(id)} variant="cancel">
                  {common("cancel")}
                </Button>
                <Button
                  className="flex items-center"
                  disabled={!isValid || state === "loading"}
                  type="submit"
                >
                  {state === "loading" ? <Loader className="mr-2" /> : null}
                  {common("search")}
                </Button>
              </div>
            </footer>

            {currentResult ? (
              <ManageCustomFieldsModal
                onUpdate={(results) => setCurrentResult({ ...currentResult, ...results })}
                category={CustomFieldCategory.VEHICLE}
                url={`/search/actions/custom-fields/vehicle/${currentResult.id}`}
                allCustomFields={currentResult.allCustomFields ?? []}
                customFields={currentResult.customFields ?? []}
              />
            ) : null}
          </Form>
        )}
      </Formik>

      <ManageVehicleFlagsModal />
      <ManageVehicleLicensesModal />
      {CREATE_USER_CITIZEN_LEO && isLeo ? (
        <RegisterVehicleModal
          onCreate={(vehicle) => {
            closeModal(ModalIds.RegisterVehicle);
            setCurrentResult(vehicle as VehicleSearchResult);
          }}
          vehicle={null}
          citizens={[]}
        />
      ) : null}
    </Modal>
  );
}
