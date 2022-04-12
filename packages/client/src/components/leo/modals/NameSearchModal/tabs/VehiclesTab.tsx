import { FullDate } from "components/shared/FullDate";
import { Table } from "components/shared/Table";
import { Status } from "components/shared/Status";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { useVehicleSearch, VehicleSearchResult } from "state/search/vehicleSearchState";
import { useModal } from "state/modalState";
import { useNameSearch } from "state/search/nameSearchState";
import { ModalIds } from "types/ModalIds";

import { TabsContent } from "components/shared/TabList";

export function NameSearchVehiclesTab() {
  const t = useTranslations();
  const common = useTranslations("Common");
  const { DMV } = useFeatureEnabled();
  const { currentResult } = useNameSearch();
  const { openModal } = useModal();
  const { setCurrentResult: setVehicleResult } = useVehicleSearch();

  function handlePlateClick(vehicle: VehicleSearchResult) {
    if (!currentResult) return;

    setVehicleResult({ ...vehicle, citizen: currentResult });
    openModal(ModalIds.VehicleSearch);
  }

  if (!currentResult) {
    return null;
  }

  return (
    <TabsContent value="vehicles">
      <h3 className="text-xl font-semibold">{t("Vehicles.registeredVehicles")}</h3>

      {currentResult.vehicles.length <= 0 ? (
        <p className="text-gray-400 my-2">{t("Leo.noVehiclesCitizen")}</p>
      ) : (
        <Table
          data={currentResult.vehicles.map((vehicle) => ({
            plate: (
              <Button
                title={common("openInSearch")}
                small
                type="button"
                onClick={() => handlePlateClick(vehicle as VehicleSearchResult)}
              >
                {vehicle.plate}
              </Button>
            ),
            model: vehicle.model.value.value,
            color: vehicle.color,
            registrationStatus: vehicle.registrationStatus.value,
            vinNumber: vehicle.vinNumber,
            dmvStatus: (
              <Status state={vehicle.dmvStatus}>{vehicle.dmvStatus?.toLowerCase()}</Status>
            ),
            createdAt: <FullDate>{vehicle.createdAt}</FullDate>,
          }))}
          columns={[
            { Header: t("Vehicles.plate"), accessor: "plate" },
            { Header: t("Vehicles.model"), accessor: "model" },
            { Header: t("Vehicles.color"), accessor: "color" },
            { Header: t("Vehicles.registrationStatus"), accessor: "registrationStatus" },
            { Header: t("Vehicles.vinNumber"), accessor: "vinNumber" },
            DMV ? { Header: t("Vehicles.dmvStatus"), accessor: "dmvStatus" } : null,
            { Header: common("createdAt"), accessor: "createdAt" },
          ]}
        />
      )}
    </TabsContent>
  );
}
