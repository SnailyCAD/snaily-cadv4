import { Button, TabsContent } from "@snailycad/ui";
import { useTranslations } from "use-intl";
import { yesOrNoText } from "lib/utils";
import { classNames } from "lib/classNames";
import { Infofield } from "components/shared/Infofield";
import { FullDate } from "components/shared/FullDate";
import { useVehicleSearch } from "state/search/vehicle-search-state";
import { Pencil } from "react-bootstrap-icons";
import { Status } from "components/shared/Status";
import { TruckLogsTable } from "../TruckLogsTable";
import { CustomFieldsArea } from "../../CustomFieldsArea";
import { useVehicleLicenses } from "hooks/locale/useVehicleLicenses";
import { useModal } from "state/modalState";
import { useRouter } from "next/router";
import { ModalIds } from "types/ModalIds";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";

export function ResultsTab() {
  const currentResult = useVehicleSearch((state) => state.currentResult);
  const { INSPECTION_STATUS_LABELS, TAX_STATUS_LABELS } = useVehicleLicenses();
  const { openModal, closeModal } = useModal();
  const { BUSINESS, DMV } = useFeatureEnabled();

  const common = useTranslations("Common");
  const vT = useTranslations("Vehicles");
  const t = useTranslations("Leo");
  const router = useRouter();

  const isLeo = router.pathname === "/officer";

  function handleEditVehicleFlags() {
    if (!currentResult) return;

    openModal(ModalIds.ManageVehicleFlags);
  }

  function handleNameClick() {
    if (!currentResult?.citizen) return;

    openModal(ModalIds.NameSearch, {
      ...currentResult.citizen,
      name: `${currentResult.citizen.name} ${currentResult.citizen.surname}`,
    });
    closeModal(ModalIds.VehicleSearchWithinName);
  }

  if (!currentResult) {
    return null;
  }

  return (
    <TabsContent className="mt-3" value="results">
      <h3 className="text-2xl font-semibold">{t("results")}</h3>

      <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-y-1">
        <li>
          <Infofield className="capitalize" label={vT("owner")}>
            <Button
              title={common("openInSearch")}
              size="xs"
              type="button"
              onPress={handleNameClick}
            >
              {currentResult.citizen
                ? `${currentResult.citizen.name} ${currentResult.citizen.surname}`
                : common("unknown")}
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
            {currentResult.taxStatus ? TAX_STATUS_LABELS[currentResult.taxStatus] : common("none")}
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
              {currentResult.Business?.[0]?.name ?? common("none")}
            </Infofield>
          </li>
        ) : null}
        <li>
          <Infofield className="capitalize flex items-center gap-2" label={vT("flags")}>
            <Button
              type="button"
              onPress={handleEditVehicleFlags}
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
              <Status fallback="—">{currentResult.dmvStatus}</Status>
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
          <Infofield
            childrenProps={{
              className: classNames(
                "capitalize",
                currentResult.impounded && "text-red-700 font-semibold",
              ),
            }}
            label={t("impounded")}
          >
            {common(yesOrNoText(currentResult.impounded))}
          </Infofield>
        </li>
        <CustomFieldsArea currentResult={currentResult} isLeo={isLeo} />
      </ul>

      <TruckLogsTable result={currentResult} />
    </TabsContent>
  );
}
