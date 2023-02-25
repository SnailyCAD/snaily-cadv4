import * as React from "react";
import { Loader, Button, Item, AsyncListSearchField, TabList } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik, useFormikContext } from "formik";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { BoloType, CustomFieldCategory, RegisteredVehicle } from "@snailycad/types";
import { useRouter } from "next/router";
import { useVehicleSearch, VehicleSearchResult } from "state/search/vehicle-search-state";
import { ManageVehicleFlagsModal } from "./VehicleSearch/ManageVehicleFlagsModal";
import { ManageVehicleLicensesModal } from "./VehicleSearch/ManageVehicleLicensesModal";
import { ManageCustomFieldsModal } from "./NameSearchModal/ManageCustomFieldsModal";
import { useNameSearch } from "state/search/name-search-state";
import { useBolos } from "hooks/realtime/useBolos";
import { ResultsTab } from "./VehicleSearch/tabs/ResultsTab";
import { NotesTab } from "./NameSearchModal/tabs/notes-tab";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { RegisterVehicleModal } from "components/citizen/vehicles/modals/register-vehicle-modal";
import type { PostMarkStolenData } from "@snailycad/types/api";
import { ImpoundVehicleModal } from "./VehicleSearch/ImpoundVehicleModal";
import { AllowImpoundedVehicleCheckoutModal } from "./AllowImpoundedVehicleCheckoutModal";
import { shallow } from "zustand/shallow";

interface Props {
  id?: ModalIds.VehicleSearch | ModalIds.VehicleSearchWithinName;
}

export function VehicleSearchModal({ id = ModalIds.VehicleSearch }: Props) {
  const { currentResult, setCurrentResult } = useVehicleSearch();
  const nameSearchState = useNameSearch(
    (state) => ({ currentResult: state.currentResult, setCurrentResult: state.setCurrentResult }),
    shallow,
  );
  const { bolos } = useBolos();

  const { isOpen, openModal, closeModal, getPayload } = useModal();
  const common = useTranslations("Common");
  const vT = useTranslations("Vehicles");
  const cT = useTranslations("Citizen");
  const t = useTranslations("Leo");
  const { state, execute } = useFetch();
  const router = useRouter();
  const { CREATE_USER_CITIZEN_LEO } = useFeatureEnabled();

  const payloadVehicle = getPayload<Partial<RegisteredVehicle> | null>(ModalIds.VehicleSearch);
  const isLeo = router.pathname === "/officer";
  const showMarkVehicleAsStolenButton = currentResult && isLeo && !currentResult.reportedStolen;
  const showImpoundVehicleButton = currentResult && isLeo && !currentResult.impounded;
  const showCreateVehicleButton = CREATE_USER_CITIZEN_LEO && isLeo && !currentResult;

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
    const { json } = await execute<VehicleSearchResult>({
      path: "/search/vehicle",
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

  async function handleMarkStolen(stolen: boolean) {
    if (!currentResult) return;

    const { json } = await execute<PostMarkStolenData>({
      path: `/bolos/mark-stolen/${currentResult.id}`,
      method: "POST",
      data: {
        value: stolen,
        id: currentResult.id,
        color: currentResult.color,
        modelId: currentResult.modelId,
        plate: currentResult.plate,
      },
    });

    if (json) {
      const updatedVehicle = { ...currentResult, reportedStolen: stolen };

      setCurrentResult(updatedVehicle);

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

  async function handleImpoundVehicle() {
    openModal(ModalIds.ImpoundVehicle);
  }

  const INITIAL_VALUES = {
    vinNumber: payloadVehicle?.vinNumber ?? currentResult?.vinNumber ?? "",
    plateOrVin: payloadVehicle?.vinNumber ?? currentResult?.vinNumber ?? "",
  };

  return (
    <Modal
      title={t("plateSearch")}
      onClose={() => closeModal(id)}
      isOpen={isOpen(id)}
      className="w-[750px]"
    >
      <Formik initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ setValues, errors, values, isValid }) => (
          <Form>
            <AsyncListSearchField<VehicleSearchResult>
              allowsCustomValue
              autoFocus
              setValues={({ localValue, node }) => {
                const vinNumber = localValue ? { vinNumber: localValue } : {};
                const plateOrVin = node ? { plateOrVin: node.key as string } : {};

                if (node) {
                  setCurrentResult(node.value);
                }

                setValues({ ...values, ...vinNumber, ...plateOrVin });
              }}
              localValue={values.vinNumber}
              errorMessage={errors.plateOrVin}
              label={t("plateOrVin")}
              selectedKey={values.plateOrVin}
              fetchOptions={{
                apiPath: "/search/vehicle?includeMany=true",
                method: "POST",
                bodyKey: "plateOrVin",
                filterTextRequired: true,
              }}
            >
              {(item) => (
                <Item key={item.vinNumber} textValue={item.vinNumber}>
                  {item.plate.toUpperCase()} ({item.vinNumber})
                </Item>
              )}
            </AsyncListSearchField>

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

            <footer
              className={`mt-4 flex ${
                (currentResult || CREATE_USER_CITIZEN_LEO) && isLeo
                  ? "justify-between"
                  : "justify-end"
              }`}
            >
              <div>
                {showCreateVehicleButton ? (
                  <Button type="button" onPress={() => openModal(ModalIds.RegisterVehicle)}>
                    {t("createVehicle")}
                  </Button>
                ) : null}

                {currentResult && isLeo ? (
                  <>
                    {showMarkVehicleAsStolenButton ? (
                      <Button
                        type="button"
                        onPress={() => handleMarkStolen(true)}
                        variant="cancel"
                        className="px-1.5"
                      >
                        {vT("reportAsStolen")}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onPress={() => handleMarkStolen(false)}
                        variant="cancel"
                        className="px-1.5"
                      >
                        {cT("unmarkAsStolen")}
                      </Button>
                    )}

                    {showImpoundVehicleButton ? (
                      <Button
                        type="button"
                        onPress={() => handleImpoundVehicle()}
                        variant="cancel"
                        className="px-1.5"
                      >
                        {t("impoundVehicle")}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onPress={() => openModal(ModalIds.AlertCheckoutImpoundedVehicle)}
                        variant="cancel"
                        className="px-1.5"
                      >
                        {t("allowCheckout")}
                      </Button>
                    )}

                    {currentResult ? (
                      <Button
                        type="button"
                        onPress={() => handleEditLicenses()}
                        variant="cancel"
                        className="px-1.5"
                      >
                        {t("editLicenses")}
                      </Button>
                    ) : null}
                  </>
                ) : null}
              </div>

              <div className="flex">
                <Button type="reset" onPress={() => closeModal(id)} variant="cancel">
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

            <AutoSubmit />
          </Form>
        )}
      </Formik>

      <ImpoundVehicleModal />
      <ManageVehicleFlagsModal />
      <ManageVehicleLicensesModal />
      <AllowImpoundedVehicleCheckoutModal
        onCheckout={(vehicle) => setCurrentResult({ ...vehicle, impounded: false })}
        vehicle={currentResult}
      />
      {CREATE_USER_CITIZEN_LEO && isLeo ? (
        <RegisterVehicleModal
          onCreate={(vehicle) => {
            closeModal(ModalIds.RegisterVehicle);
            setCurrentResult(vehicle as VehicleSearchResult);
          }}
          vehicle={null}
        />
      ) : null}
    </Modal>
  );
}

function AutoSubmit() {
  const { getPayload } = useModal();
  const payloadVehicle = getPayload<Partial<RegisteredVehicle>>(ModalIds.VehicleSearch);
  const { submitForm } = useFormikContext();

  // if there's a name, auto-submit the form.
  React.useEffect(() => {
    if (payloadVehicle) {
      submitForm();
    }
  }, [payloadVehicle, submitForm]);

  return null;
}
