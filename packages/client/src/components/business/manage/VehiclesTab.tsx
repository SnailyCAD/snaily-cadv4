import * as React from "react";
import { TabsContent } from "components/shared/TabList";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { useBusinessState } from "state/businessState";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import type { RegisteredVehicle } from "@snailycad/types";
import useFetch from "lib/useFetch";
import { RegisterVehicleModal } from "components/citizen/vehicles/RegisterVehicleModal";
import { AlertModal } from "components/modal/AlertModal";
import { FullDate } from "components/shared/FullDate";
import { Table } from "components/shared/Table";

export function VehiclesTab() {
  const [tempVehicle, setTempVehicle] = React.useState<RegisteredVehicle | null>(null);

  const { state, execute } = useFetch();
  const { openModal, closeModal } = useModal();
  const common = useTranslations("Common");
  const bus = useTranslations("Business");
  const t = useTranslations();

  const { currentBusiness, currentEmployee, setCurrentBusiness } = useBusinessState();
  const vehicles = currentBusiness?.vehicles ?? [];

  function handleManageClick(employee: RegisteredVehicle) {
    setTempVehicle(employee);
    openModal(ModalIds.RegisterVehicle);
  }

  function handleDeleteClick(employee: RegisteredVehicle) {
    setTempVehicle(employee);
    openModal(ModalIds.AlertDeleteVehicle);
  }

  async function handleDelete() {
    if (!tempVehicle || !currentBusiness) return;

    const { json } = await execute(`/vehicles/${tempVehicle.id}`, {
      method: "DELETE",
    });

    if (json) {
      const updated = {
        ...currentBusiness,
        vehicles: currentBusiness.vehicles.filter((v) => v.id !== tempVehicle.id),
      };
      setCurrentBusiness(updated);
      setTempVehicle(null);
      closeModal(ModalIds.AlertDeleteVehicle);
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
          <Button onClick={() => openModal(ModalIds.RegisterVehicle)}>
            {t("Citizen.registerVehicle")}
          </Button>
        </div>
      </header>

      <Table
        data={vehicles.map((vehicle) => ({
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
                onClick={() => handleManageClick(vehicle)}
                small
                variant="success"
              >
                {common("edit")}
              </Button>
              <Button
                disabled={vehicle.impounded}
                className="ml-2"
                onClick={() => handleDeleteClick(vehicle)}
                small
                variant="danger"
              >
                {common("delete")}
              </Button>
            </>
          ),
        }))}
        columns={[
          { Header: t("Vehicles.plate"), accessor: "plate" },
          { Header: t("Vehicles.model"), accessor: "model" },
          { Header: t("Vehicles.color"), accessor: "color" },
          { Header: t("Vehicles.registrationStatus"), accessor: "registrationStatus" },
          { Header: t("Vehicles.vinNumber"), accessor: "vinNumber" },
          { Header: common("createdAt"), accessor: "createdAt" },
          { Header: common("actions"), accessor: "actions" },
        ]}
      />

      <AlertModal
        className="w-[600px]"
        title={t("Vehicles.deleteVehicle")}
        id={ModalIds.AlertDeleteVehicle}
        description={t("Vehicles.alert_deleteVehicle")}
        onDeleteClick={handleDelete}
        state={state}
        onClose={() => setTempVehicle(null)}
      />

      <RegisterVehicleModal
        onClose={() => setTempVehicle(null)}
        onCreate={(vehicle) => {
          closeModal(ModalIds.RegisterVehicle);
          setCurrentBusiness({
            ...currentBusiness,
            vehicles: [vehicle, ...currentBusiness.vehicles],
          });
        }}
        onUpdate={(oldVehicle, newVehicle) => {
          closeModal(ModalIds.RegisterVehicle);
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
        citizens={[currentEmployee?.citizen]}
        vehicle={tempVehicle}
      />
    </TabsContent>
  );
}
