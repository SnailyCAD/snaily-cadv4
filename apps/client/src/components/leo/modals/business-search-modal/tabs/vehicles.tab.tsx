import type { RegisteredVehicle } from "@snailycad/types";
import { Button, TabsContent } from "@snailycad/ui";
import { FullDate } from "components/shared/FullDate";
import { Table, useTableState } from "components/shared/Table";
import { useModal } from "state/modalState";
import { useBusinessSearch } from "state/search/business-search-state";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";

export function BusinessSearchVehiclesTab() {
  const t = useTranslations();
  const { currentResult } = useBusinessSearch();
  const tableState = useTableState();
  const { openModal, closeModal } = useModal();

  if (!currentResult) {
    return null;
  }

  function handleOpenInVehicleSearch(vehicle: RegisteredVehicle) {
    closeModal(ModalIds.BusinessSearch);
    openModal(ModalIds.VehicleSearch, vehicle);
  }

  return (
    <TabsContent value="business-search-vehicles-tab">
      <header className="flex items-center justify-between mb-3">
        <h3 className="text-xl font-semibold">{t("Leo.vehicles")}</h3>
      </header>

      {currentResult.vehicles.length <= 0 ? (
        <p className="text-neutral-800 dark:text-gray-400">{t("Leo.businessHasNoVehicles")}</p>
      ) : (
        <Table
          features={{ isWithinCardOrModal: true }}
          columns={[
            { header: t("Vehicles.plate"), accessorKey: "plate" },
            { header: t("Vehicles.model"), accessorKey: "model" },
            { header: t("Vehicles.color"), accessorKey: "color" },
            { header: t("Vehicles.registrationStatus"), accessorKey: "registrationStatus" },
            { header: t("Vehicles.vinNumber"), accessorKey: "vinNumber" },
            { header: t("Common.createdAt"), accessorKey: "createdAt" },
            { header: t("Common.actions"), accessorKey: "actions" },
          ]}
          data={currentResult.vehicles.map((vehicle) => ({
            id: vehicle.id,
            plate: vehicle.plate,
            model: vehicle.model.value.value,
            color: vehicle.color,
            registrationStatus: vehicle.registrationStatus.value,
            vinNumber: vehicle.vinNumber,
            createdAt: <FullDate>{vehicle.createdAt}</FullDate>,
            actions: (
              <Button type="button" onPress={() => handleOpenInVehicleSearch(vehicle)} size="xs">
                {t("Leo.viewInVehicleSearch")}
              </Button>
            ),
          }))}
          tableState={tableState}
        />
      )}
    </TabsContent>
  );
}
