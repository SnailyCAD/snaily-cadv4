import { FullDate } from "components/shared/FullDate";
import { Table, useTableState } from "components/shared/Table";
import { Status } from "components/shared/Status";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useTranslations } from "use-intl";
import { Button, TabsContent } from "@snailycad/ui";
import { useVehicleSearch, VehicleSearchResult } from "state/search/vehicle-search-state";
import { useModal } from "state/modalState";
import { useNameSearch } from "state/search/name-search-state";
import { ModalIds } from "types/ModalIds";

export function NameSearchVehiclesTab() {
  const t = useTranslations();
  const common = useTranslations("Common");
  const { DMV } = useFeatureEnabled();
  const currentResult = useNameSearch((state) => state.currentResult);
  const { openModal } = useModal();
  const { setCurrentResult: setVehicleResult } = useVehicleSearch();
  const tableState = useTableState();

  function handlePlateClick(vehicle: VehicleSearchResult) {
    if (!currentResult || currentResult.isConfidential) return;

    setVehicleResult({ ...vehicle, citizen: currentResult });
    openModal(ModalIds.VehicleSearchWithinName);
  }

  if (!currentResult || currentResult.isConfidential) {
    return null;
  }

  return (
    <TabsContent value="vehicles">
      <h3 className="text-xl font-semibold">{t("Vehicles.registeredVehicles")}</h3>

      {currentResult.vehicles.length <= 0 ? (
        <p className="text-neutral-700 dark:text-gray-400 my-2">{t("Leo.noVehiclesCitizen")}</p>
      ) : (
        <Table
          features={{ isWithinCardOrModal: true }}
          tableState={tableState}
          data={currentResult.vehicles.map((vehicle) => ({
            id: vehicle.id,
            plate: (
              <Button
                title={common("openInSearch")}
                size="xs"
                type="button"
                onPress={() => handlePlateClick(vehicle as VehicleSearchResult)}
              >
                {vehicle.plate}
              </Button>
            ),
            model: vehicle.model.value.value,
            color: vehicle.color,
            registrationStatus: vehicle.registrationStatus.value,
            vinNumber: vehicle.vinNumber,
            dmvStatus: <Status fallback="—">{vehicle.dmvStatus}</Status>,
            createdAt: <FullDate>{vehicle.createdAt}</FullDate>,
          }))}
          columns={[
            { header: t("Vehicles.plate"), accessorKey: "plate" },
            { header: t("Vehicles.model"), accessorKey: "model" },
            { header: t("Vehicles.color"), accessorKey: "color" },
            { header: t("Vehicles.registrationStatus"), accessorKey: "registrationStatus" },
            { header: t("Vehicles.vinNumber"), accessorKey: "vinNumber" },
            DMV ? { header: t("Vehicles.dmvStatus"), accessorKey: "dmvStatus" } : null,
            { header: common("createdAt"), accessorKey: "createdAt" },
          ]}
        />
      )}
    </TabsContent>
  );
}
