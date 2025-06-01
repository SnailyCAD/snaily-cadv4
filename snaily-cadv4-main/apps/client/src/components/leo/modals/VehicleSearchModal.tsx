import * as React from "react";
import { Loader, Button, Item, AsyncListSearchField, TabList } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik, useFormikContext } from "formik";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";
import { BoloType, CustomFieldCategory, type RegisteredVehicle } from "@snailycad/types";
import { useRouter } from "next/router";
import { useVehicleSearch, type VehicleSearchResult } from "state/search/vehicle-search-state";
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
import { ImpoundVehicleModal } from "./VehicleSearch/impound-vehicle-modal";
import { AllowImpoundedVehicleCheckoutModal } from "./AllowImpoundedVehicleCheckoutModal";
import { ImageWrapper } from "components/shared/image-wrapper";
import { useImageUrl } from "hooks/useImageUrl";

interface Props {
  id?: ModalIds.VehicleSearch | ModalIds.VehicleSearchWithinName;
}

export function VehicleSearchModal({ id = ModalIds.VehicleSearch }: Props) {
  const { currentResult, setCurrentResult } = useVehicleSearch();
  const nameSearchState = useNameSearch((state) => ({
    currentResult: state.currentResult,
    setCurrentResult: state.setCurrentResult,
  }));
  const { bolos } = useBolos();

  const modalState = useModal();
  const common = useTranslations("Common");
  const vT = useTranslations("Vehicles");
  const cT = useTranslations("Citizen");
  const t = useTranslations("Leo");
  const { state, execute } = useFetch();
  const router = useRouter();
  const { CREATE_USER_CITIZEN_LEO } = useFeatureEnabled();
  const { makeImageUrl } = useImageUrl();

  const payloadVehicle = modalState.getPayload<Partial<RegisteredVehicle> | null>(
    ModalIds.VehicleSearch,
  );
  const isLeo = router.pathname === "/officer";
  const showMarkVehicleAsStolenButton =
    hasSearchResults(currentResult) && isLeo && !currentResult.reportedStolen;
  const showImpoundVehicleButton =
    hasSearchResults(currentResult) && isLeo && !currentResult.impounded;
  const showCreateVehicleButton =
    CREATE_USER_CITIZEN_LEO && isLeo && !hasSearchResults(currentResult);

  const bolo = React.useMemo(() => {
    if (!hasSearchResults(currentResult)) return null;
    if (bolos.length <= 0) return null;

    const boloWithPlate = bolos.find(
      (v) =>
        v.type === BoloType.VEHICLE && v.plate?.toUpperCase() === currentResult.plate.toUpperCase(),
    );

    return boloWithPlate ?? null;
  }, [bolos, currentResult]);

  React.useEffect(() => {
    if (!modalState.isOpen(id)) {
      setCurrentResult("initial");
    }
  }, [id, modalState, setCurrentResult]);

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

    modalState.openModal(ModalIds.ManageVehicleLicenses);
  }

  async function handleMarkStolen(stolen: boolean) {
    if (!hasSearchResults(currentResult)) return;

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

  const INITIAL_VALUES = {
    vinNumber:
      payloadVehicle?.vinNumber ?? (hasSearchResults(currentResult) ? currentResult.vinNumber : ""),
    plateOrVin:
      payloadVehicle?.vinNumber ??
      (hasSearchResults(currentResult) ? currentResult?.vinNumber : ""),
  };

  return (
    <Modal
      title={t("plateSearch")}
      onClose={() => modalState.closeModal(id)}
      isOpen={modalState.isOpen(id)}
      className={currentResult ? "w-[900px]" : "w-[650px]"}
    >
      <Formik initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ setValues, setFieldValue, errors, values, isValid }) => (
          <Form>
            <AsyncListSearchField<VehicleSearchResult>
              allowsCustomValue
              autoFocus
              onInputChange={(value) => setFieldValue("vinNumber", value)}
              onSelectionChange={(node) => {
                if (node) {
                  setCurrentResult(node.value);

                  setValues({
                    ...values,
                    vinNumber: node.value?.vinNumber ?? node.textValue,
                    plateOrVin: node.key as string,
                  });
                }
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
              {(item) => {
                const imageUrl = makeImageUrl("values", item.imageId || item.model.imageId);

                return (
                  <Item key={item.vinNumber} textValue={item.vinNumber}>
                    <div className="flex items-center gap-2">
                      {imageUrl ? (
                        <ImageWrapper
                          quality={70}
                          alt={item.plate.toUpperCase()}
                          loading="lazy"
                          src={imageUrl}
                          width={30}
                          height={30}
                          className="object-cover"
                        />
                      ) : null}
                      {item.plate.toUpperCase()} ({item.vinNumber})
                    </div>
                  </Item>
                );
              }}
            </AsyncListSearchField>

            {currentResult === "initial" ? null : !currentResult ? (
              <p>{t("vehicleNotFound")}</p>
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
                  queryState={false}
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
                  <Button
                    type="button"
                    onPress={() => modalState.openModal(ModalIds.RegisterVehicle)}
                  >
                    {t("createVehicle")}
                  </Button>
                ) : null}

                {typeof currentResult !== "string" && currentResult && isLeo ? (
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
                        onPress={() => modalState.openModal(ModalIds.ImpoundVehicle)}
                        variant="cancel"
                        className="px-1.5"
                      >
                        {t("impoundVehicle")}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onPress={() => modalState.openModal(ModalIds.AlertCheckoutImpoundedVehicle)}
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
                <Button type="reset" onPress={() => modalState.closeModal(id)} variant="cancel">
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

            {hasSearchResults(currentResult) ? (
              <>
                <ManageCustomFieldsModal
                  onUpdate={(results) => setCurrentResult({ ...currentResult, ...results })}
                  category={CustomFieldCategory.VEHICLE}
                  url={`/search/actions/custom-fields/vehicle/${currentResult.id}`}
                  allCustomFields={currentResult.allCustomFields ?? []}
                  customFields={currentResult.customFields ?? []}
                />
                <AllowImpoundedVehicleCheckoutModal
                  onCheckout={(vehicle) => setCurrentResult({ ...vehicle, impounded: false })}
                  vehicle={currentResult}
                />
              </>
            ) : null}

            <AutoSubmit />
          </Form>
        )}
      </Formik>

      <ImpoundVehicleModal />
      <ManageVehicleFlagsModal />
      <ManageVehicleLicensesModal />

      {CREATE_USER_CITIZEN_LEO && isLeo ? (
        <RegisterVehicleModal
          onCreate={(vehicle) => {
            modalState.closeModal(ModalIds.RegisterVehicle);
            setCurrentResult(vehicle as VehicleSearchResult);
          }}
          vehicle={null}
        />
      ) : null}
    </Modal>
  );
}

function AutoSubmit() {
  const modalState = useModal();
  const payloadVehicle = modalState.getPayload<Partial<RegisteredVehicle>>(ModalIds.VehicleSearch);
  const { submitForm } = useFormikContext();

  // if there's a name, auto-submit the form.
  React.useEffect(() => {
    if (payloadVehicle) {
      submitForm();
    }
  }, [payloadVehicle, submitForm]);

  return null;
}

export function hasSearchResults(
  currentResult: VehicleSearchResult | "initial" | null,
): currentResult is VehicleSearchResult {
  if (currentResult === "initial") return false;
  if (!currentResult) return false;

  return true;
}
