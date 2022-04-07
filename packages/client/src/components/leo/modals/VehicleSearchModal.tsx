import * as React from "react";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import { CustomFieldCategory, RegisteredVehicle } from "@snailycad/types";
import { useRouter } from "next/router";
import { InputSuggestions } from "components/form/inputs/InputSuggestions";
import { yesOrNoText } from "lib/utils";
import { classNames } from "lib/classNames";
import { TruckLogsTable } from "./VehicleSearch/TruckLogsTable";
import { Infofield } from "components/shared/Infofield";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { FullDate } from "components/shared/FullDate";
import { useVehicleSearch, VehicleSearchResult } from "state/search/vehicleSearchState";
import { Pencil } from "react-bootstrap-icons";
import { ManageVehicleFlagsModal } from "./VehicleSearch/ManageVehicleFlagsModal";
import { ManageVehicleLicensesModal } from "./VehicleSearch/ManageVehicleLicensesModal";
import { useVehicleLicenses } from "hooks/locale/useVehicleLicenses";
import { ManageCustomFieldsModal } from "./NameSearchModal/ManageCustomFieldsModal";
import { CustomFieldsArea } from "./CustomFieldsArea";
import { Status } from "components/shared/Status";

export function VehicleSearchModal() {
  const { currentResult, setCurrentResult } = useVehicleSearch();
  const { INSPECTION_STATUS_LABELS, TAX_STATUS_LABELS } = useVehicleLicenses();

  const { isOpen, openModal, closeModal } = useModal();
  const common = useTranslations("Common");
  const vT = useTranslations("Vehicles");
  const t = useTranslations("Leo");
  const { state, execute } = useFetch();
  const { BUSINESS, DMV } = useFeatureEnabled();
  const router = useRouter();
  const isLeo = router.pathname === "/officer";
  const showMarkStolen = currentResult && isLeo && !currentResult.reportedStolen;

  React.useEffect(() => {
    if (!isOpen(ModalIds.VehicleSearch)) {
      setCurrentResult(undefined);
    }
  }, [isOpen, setCurrentResult]);

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

  function handleNameClick() {
    if (!currentResult) return;

    openModal(ModalIds.NameSearch, {
      name: `${currentResult.citizen.name} ${currentResult.citizen.surname}`,
    });
    closeModal(ModalIds.VehicleSearch);
  }

  function handleEditVehicleFlags() {
    if (!currentResult) return;

    openModal(ModalIds.ManageVehicleFlags);
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
      setCurrentResult({ ...currentResult, reportedStolen: true });
    }
  }

  const INITIAL_VALUES = {
    plateOrVin: currentResult?.vinNumber ?? "",
  };

  return (
    <Modal
      title={t("plateSearch")}
      onClose={() => closeModal(ModalIds.VehicleSearch)}
      isOpen={isOpen(ModalIds.VehicleSearch)}
      className="w-[750px]"
    >
      <Formik initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleChange, setFieldValue, errors, values, isValid }) => (
          <Form>
            <FormField errorMessage={errors.plateOrVin} label={t("plateOrVin")}>
              <InputSuggestions
                onSuggestionClick={(suggestion: VehicleSearchResult) => {
                  setFieldValue("plateOrVin", suggestion.vinNumber);
                  setCurrentResult(suggestion);
                }}
                Component={({ suggestion }: { suggestion: RegisteredVehicle }) => (
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

                <ul className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-y-1">
                  <li>
                    <Infofield className="capitalize" label={vT("owner")}>
                      <Button
                        title={common("openInSearch")}
                        small
                        type="button"
                        onClick={handleNameClick}
                      >
                        {currentResult.citizen.name} {currentResult.citizen.surname}
                      </Button>
                    </Infofield>
                  </li>
                  <li>
                    <Infofield label={vT("plate")}>{currentResult.plate.toUpperCase()}</Infofield>
                  </li>
                  <li>
                    <Infofield label={vT("model")}>{currentResult.model.value.value}</Infofield>
                  </li>
                  <li>
                    <Infofield label={vT("color")}> {currentResult.color}</Infofield>
                  </li>
                  <li>
                    <Infofield label={vT("vinNumber")}>{currentResult.vinNumber}</Infofield>
                  </li>
                  <li>
                    <Infofield label={vT("registrationStatus")}>
                      {currentResult.registrationStatus.value}
                    </Infofield>
                  </li>
                  <li>
                    <Infofield label={vT("insuranceStatus")}>
                      {currentResult.insuranceStatus?.value ?? common("none")}
                    </Infofield>
                  </li>
                  <li>
                    <Infofield label={vT("taxStatus")}>
                      {currentResult.taxStatus
                        ? TAX_STATUS_LABELS[currentResult.taxStatus]
                        : common("none")}
                    </Infofield>
                  </li>
                  <li>
                    <Infofield label={vT("inspectionStatus")}>
                      {currentResult.inspectionStatus
                        ? INSPECTION_STATUS_LABELS[currentResult.inspectionStatus]
                        : common("none")}
                    </Infofield>
                  </li>
                  <li>
                    <Infofield label={common("createdAt")}>
                      <FullDate>{currentResult.createdAt}</FullDate>
                    </Infofield>
                  </li>

                  {BUSINESS ? (
                    <li>
                      <Infofield className="capitalize" label={vT("business")}>
                        {currentResult.Business[0]?.name ?? common("none")}
                      </Infofield>
                    </li>
                  ) : null}
                  <li>
                    <Infofield className="capitalize flex items-center gap-2" label={vT("flags")}>
                      <Button
                        type="button"
                        onClick={handleEditVehicleFlags}
                        title={t("manageVehicleFlags")}
                        aria-label={t("manageVehicleFlags")}
                        className="px-1 mr-2"
                      >
                        <Pencil />
                      </Button>
                      {currentResult.flags?.map((v) => v.value).join(", ") || common("none")}
                    </Infofield>
                  </li>
                  {DMV ? (
                    <li>
                      <Infofield label={vT("dmvStatus")}>
                        <Status state={currentResult.dmvStatus}>
                          {currentResult.dmvStatus?.toLowerCase()}
                        </Status>
                      </Infofield>
                    </li>
                  ) : null}
                  <li>
                    <Infofield
                      childrenProps={{
                        className: classNames(
                          "capitalize",
                          currentResult.reportedStolen && "text-red-700 font-semibold",
                        ),
                      }}
                      label={t("reportedStolen")}
                    >
                      {common(yesOrNoText(currentResult.reportedStolen))}
                    </Infofield>
                  </li>

                  <CustomFieldsArea currentResult={currentResult} isLeo={isLeo} />
                </ul>

                <TruckLogsTable result={currentResult} />
              </div>
            )}

            <footer className="mt-5 flex justify-between">
              <div className="flex gap-2">
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
                <Button
                  type="reset"
                  onClick={() => closeModal(ModalIds.VehicleSearch)}
                  variant="cancel"
                >
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
    </Modal>
  );
}
