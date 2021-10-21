import * as React from "react";
import { Button } from "components/Button";
import { RegisteredVehicle } from "types/prisma";
import { RegisterVehicleModal } from "./modals/RegisterVehicleModal";
import { ModalIds } from "types/ModalIds";
import { useModal } from "context/ModalContext";
import { useTranslations } from "use-intl";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import format from "date-fns/format";

export const VehiclesCard = (props: { vehicles: RegisteredVehicle[] }) => {
  const { openModal, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Vehicles");
  const { state, execute } = useFetch();

  const [vehicles, setVehicles] = React.useState<RegisteredVehicle[]>(props.vehicles);
  const [tempVehicle, setTempVehicle] = React.useState<RegisteredVehicle | null>(null);

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
      <div className="bg-gray-200/60 p-4 rounded-md">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{t("yourVehicles")}</h1>

          <Button onClick={() => openModal(ModalIds.RegisterVehicle)} small>
            {t("addVehicle")}
          </Button>
        </header>

        {vehicles.length <= 0 ? (
          <p className="text-gray-600">{t("noVehicles")}</p>
        ) : (
          <div className="overflow-x-auto w-full mt-3">
            <table className="overflow-hidden w-full whitespace-nowrap max-h-64">
              <thead>
                <tr>
                  <th>{t("plate")}</th>
                  <th>{t("model")}</th>
                  <th>{t("color")}</th>
                  <th>{t("registrationStatus")}</th>
                  <th>{t("vinNumber")}</th>
                  <th>{common("createdAt")}</th>
                  <th>{common("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td>{vehicle.plate.toUpperCase()}</td>
                    <td>{vehicle.model.value}</td>
                    <td>{vehicle.color}</td>
                    <td>{vehicle.registrationStatus.value}</td>
                    <td>{vehicle.vinNumber}</td>
                    <td>{format(new Date(vehicle.createdAt), "yyyy-MM-dd")}</td>
                    <td className="w-36">
                      <Button onClick={() => handleEditClick(vehicle)} small variant="success">
                        {common("edit")}
                      </Button>
                      <Button
                        className="ml-2"
                        onClick={() => handleDeleteClick(vehicle)}
                        small
                        variant="danger"
                      >
                        {common("delete")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        className="min-w-[600px]"
        title={t("deleteVehicle")}
        id={ModalIds.AlertDeleteVehicle}
        description={t("alert_deleteVehicle")}
        onDeleteClick={handleDelete}
        state={state}
        onClose={() => setTempVehicle(null)}
      />
    </>
  );
};
