import { useTranslations } from "use-intl";
import { Button, FullDate, TabsContent } from "@snailycad/ui";
import { useBusinessState } from "state/business-state";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import type { RegisteredVehicle } from "@snailycad/types";
import useFetch from "lib/useFetch";
import { RegisterVehicleModal } from "components/citizen/vehicles/modals/register-vehicle-modal";
import { AlertModal } from "components/modal/AlertModal";
import { Table, useTableState } from "components/shared/Table";
import type { DeleteCitizenVehicleData } from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";

export function VehiclesTab() {
  const { state, execute } = useFetch();
  const modalState = useModal();
  const common = useTranslations("Common");
  const bus = useTranslations("Business");
  const t = useTranslations();
  const tableState = useTableState();
  const { currentBusiness, currentEmployee, setCurrentBusiness } = useBusinessState((state) => ({
    currentBusiness: state.currentBusiness,
    currentEmployee: state.currentEmployee,
    setCurrentBusiness: state.setCurrentBusiness,
  }));

  const vehicles = currentBusiness?.vehicles ?? [];
  const [tempVehicle, vehicleState] = useTemporaryItem(vehicles);

  function handleManageClick(vehicle: RegisteredVehicle) {
    vehicleState.setTempId(vehicle.id);
    modalState.openModal(ModalIds.RegisterVehicle);
  }

  function handleDeleteClick(vehicle: RegisteredVehicle) {
    vehicleState.setTempId(vehicle.id);
    modalState.openModal(ModalIds.AlertDeleteVehicle);
  }

  async function handleDelete() {
    if (!tempVehicle || !currentBusiness) return;

    const { json } = await execute<DeleteCitizenVehicleData>({
      path: `/vehicles/${tempVehicle.id}`,
      method: "DELETE",
    });

    if (json) {
      const updated = {
        ...currentBusiness,
        vehicles: currentBusiness.vehicles.filter((v) => v.id !== tempVehicle.id),
      };
      setCurrentBusiness(updated);
      vehicleState.setTempId(null);
      modalState.closeModal(ModalIds.AlertDeleteVehicle);
    }
  }

  if (!currentEmployee || !currentBusiness) {
    return null;
  }

  return (
    <TabsContent aria-label={t("Business.businessVehicles")} value="businessVehicles">
      <header className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold">{bus("businessVehicles")}</h3>

        <div>
          <Button onPress={() => modalState.openModal(ModalIds.RegisterVehicle)}>
            {t("Citizen.registerVehicle")}
          </Button>
        </div>
      </header>

      {vehicles.length <= 0 ? (
        <p className="mt-2">{t("Business.noVehicles")}</p>
      ) : (
        <Table
          tableState={tableState}
          data={vehicles.map((vehicle) => ({
            id: vehicle.id,
            plate: vehicle.plate,
            model: vehicle.model.value.value,
            color: vehicle.color,
            registrationStatus: vehicle.registrationStatus.value,
            vinNumber: vehicle.vinNumber,
            createdAt: <FullDate>{vehicle.createdAt}</FullDate>,
            actions: (
              <>
                <Button
                  disabled={vehicle.impounded}
                  onPress={() => handleManageClick(vehicle)}
                  size="xs"
                  variant="success"
                >
                  {common("edit")}
                </Button>
                <Button
                  disabled={vehicle.impounded}
                  className="ml-2"
                  onPress={() => handleDeleteClick(vehicle)}
                  size="xs"
                  variant="danger"
                >
                  {common("delete")}
                </Button>
              </>
            ),
          }))}
          columns={[
            { header: t("Vehicles.plate"), accessorKey: "plate" },
            { header: t("Vehicles.model"), accessorKey: "model" },
            { header: t("Vehicles.color"), accessorKey: "color" },
            { header: t("Vehicles.registrationStatus"), accessorKey: "registrationStatus" },
            { header: t("Vehicles.vinNumber"), accessorKey: "vinNumber" },
            { header: common("createdAt"), accessorKey: "createdAt" },
            { header: common("actions"), accessorKey: "actions" },
          ]}
        />
      )}

      <AlertModal
        className="w-[600px]"
        title={t("Vehicles.deleteVehicle")}
        id={ModalIds.AlertDeleteVehicle}
        description={t("Vehicles.alert_deleteVehicle")}
        onDeleteClick={handleDelete}
        state={state}
        onClose={() => vehicleState.setTempId(null)}
      />

      <RegisterVehicleModal
        onClose={() => vehicleState.setTempId(null)}
        onCreate={(vehicle) => {
          modalState.closeModal(ModalIds.RegisterVehicle);
          setCurrentBusiness({
            ...currentBusiness,
            vehicles: [vehicle, ...currentBusiness.vehicles],
          });
        }}
        onUpdate={(oldVehicle, newVehicle) => {
          modalState.closeModal(ModalIds.RegisterVehicle);
          setCurrentBusiness({
            ...currentBusiness,
            vehicles: currentBusiness.vehicles.map((v) => {
              if (v.id === oldVehicle.id) {
                return { ...v, ...newVehicle };
              }
              return v;
            }),
          });
        }}
        vehicle={tempVehicle}
      />
    </TabsContent>
  );
}
