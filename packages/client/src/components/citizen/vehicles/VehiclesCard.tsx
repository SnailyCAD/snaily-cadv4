import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import type { RegisteredVehicle } from "@snailycad/types";
import { RegisterVehicleModal } from "./RegisterVehicleModal";
import { ModalIds } from "types/ModalIds";
import { useModal } from "context/ModalContext";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { Table } from "components/shared/Table";
import { FullDate } from "components/shared/FullDate";

export function VehiclesCard(props: { vehicles: RegisteredVehicle[] }) {
  const { openModal, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Vehicles");
  const { state, execute } = useFetch();

  const [vehicles, setVehicles] = React.useState<RegisteredVehicle[]>(props.vehicles);
  const [tempVehicle, setTempVehicle] = React.useState<RegisteredVehicle | null>(null);

  React.useEffect(() => {
    setVehicles(props.vehicles);
  }, [props.vehicles]);

  async function handleDelete() {
    if (!tempVehicle) return;

    const { json } = await execute(`/vehicles/${tempVehicle.id}`, {
      method: "DELETE",
    });

    if (json) {
      setVehicles((p) => p.filter((v) => v.id !== tempVehicle.id));
      setTempVehicle(null);
      closeModal(ModalIds.AlertDeleteVehicle);
    }
  }

  function handleDeleteClick(vehicle: RegisteredVehicle) {
    setTempVehicle(vehicle);
    openModal(ModalIds.AlertDeleteVehicle);
  }

  function handleEditClick(vehicle: RegisteredVehicle) {
    setTempVehicle(vehicle);
    openModal(ModalIds.RegisterVehicle);
  }

  return (
    <>
      <div className="p-4 card">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{t("yourVehicles")}</h1>

          <Button onClick={() => openModal(ModalIds.RegisterVehicle)} small>
            {t("addVehicle")}
          </Button>
        </header>

        {vehicles.length <= 0 ? (
          <p className="text-gray-600 dark:text-gray-400">{t("noVehicles")}</p>
        ) : (
          <Table
            isWithinCard
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
                    onClick={() => handleEditClick(vehicle)}
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
              { Header: t("plate"), accessor: "plate" },
              { Header: t("model"), accessor: "model" },
              { Header: t("color"), accessor: "color" },
              { Header: t("registrationStatus"), accessor: "registrationStatus" },
              { Header: t("vinNumber"), accessor: "vinNumber" },
              { Header: common("createdAt"), accessor: "createdAt" },
              { Header: common("actions"), accessor: "actions" },
            ]}
          />
        )}
      </div>

      <RegisterVehicleModal
        onCreate={(weapon) => {
          closeModal(ModalIds.RegisterVehicle);
          setVehicles((p) => [...p, weapon]);
        }}
        onUpdate={(old, newW) => {
          setVehicles((p) => {
            const idx = p.indexOf(old);
            p[idx] = newW;
            return p;
          });
          closeModal(ModalIds.RegisterVehicle);
        }}
        vehicle={tempVehicle}
        citizens={[]}
        onClose={() => setTempVehicle(null)}
      />

      <AlertModal
        className="w-[600px]"
        title={t("deleteVehicle")}
        id={ModalIds.AlertDeleteVehicle}
        description={t("alert_deleteVehicle")}
        onDeleteClick={handleDelete}
        state={state}
        onClose={() => setTempVehicle(null)}
      />
    </>
  );
}
