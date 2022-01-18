import * as React from "react";
import { Tab } from "@headlessui/react";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { useBusinessState } from "state/businessState";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { RegisteredVehicle } from "types/prisma";
import useFetch from "lib/useFetch";
import { RegisterVehicleModal } from "components/citizen/vehicles/RegisterVehicleModal";
import { AlertModal } from "components/modal/AlertModal";

export function VehiclesTab() {
  const [tempVehicle, setTempVehicle] = React.useState<RegisteredVehicle | null>(null);

  const { state, execute } = useFetch();
  const { openModal, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Business");
  const veh = useTranslations("Vehicles");

  const { currentBusiness, setCurrentBusiness } = useBusinessState();

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

  return (
    <Tab.Panel className="mt-3">
      <h3 className="text-2xl font-semibold">{t("businessVehicles")}</h3>

      <ul className="mt-3 space-y-3">
        {(currentBusiness?.vehicles ?? []).map((vehicle) => (
          <li className="flex items-baseline justify-between p-4 card" key={vehicle.id}>
            <div>
              <span className="text-xl font-semibold">{vehicle.plate}</span>
              <p>
                <span className="font-semibold">{veh("model")}: </span>
                {vehicle.model.value.value}
              </p>
              <p>
                <span className="font-semibold">{veh("color")}: </span>
                {vehicle.color}
              </p>
              <p>
                <span className="font-semibold">{veh("registrationStatus")}: </span>
                {vehicle.registrationStatus.value}
              </p>
            </div>

            <div>
              <Button onClick={() => handleManageClick(vehicle)} variant="success">
                {common("manage")}
              </Button>
              <Button onClick={() => handleDeleteClick(vehicle)} className="ml-2" variant="danger">
                {t("delete")}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <AlertModal
        className="w-[600px]"
        title={veh("deleteVehicle")}
        id={ModalIds.AlertDeleteVehicle}
        description={veh("alert_deleteVehicle")}
        onDeleteClick={handleDelete}
        state={state}
        onClose={() => setTempVehicle(null)}
      />

      <RegisterVehicleModal citizens={[]} vehicle={tempVehicle} />
    </Tab.Panel>
  );
}
