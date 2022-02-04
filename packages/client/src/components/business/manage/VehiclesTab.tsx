import * as React from "react";
import { Tab } from "@headlessui/react";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { useBusinessState } from "state/businessState";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import type { RegisteredVehicle } from "@snailycad/types";
import useFetch from "lib/useFetch";
import { RegisterVehicleModal } from "components/citizen/vehicles/RegisterVehicleModal";
import { AlertModal } from "components/modal/AlertModal";

export function VehiclesTab() {
  const [tempVehicle, setTempVehicle] = React.useState<RegisteredVehicle | null>(null);

  const { state, execute } = useFetch();
  const { openModal, closeModal } = useModal();
  const common = useTranslations("Common");
  const bus = useTranslations("Business");
  const t = useTranslations();

  const { currentBusiness, currentEmployee, setCurrentBusiness } = useBusinessState();

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
    <Tab.Panel className="mt-3">
      <header className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold">{bus("businessVehicles")}</h3>

        <div>
          <Button onClick={() => openModal(ModalIds.RegisterVehicle)}>
            {t("Citizen.registerVehicle")}
          </Button>
        </div>
      </header>

      <ul className="mt-3 space-y-3">
        {(currentBusiness?.vehicles ?? []).map((vehicle) => (
          <li className="flex items-baseline justify-between p-4 card" key={vehicle.id}>
            <div>
              <span className="text-xl font-semibold">{vehicle.plate}</span>
              <p>
                <span className="font-semibold">{t("Vehicles.model")}: </span>
                {vehicle.model.value.value}
              </p>
              <p>
                <span className="font-semibold">{t("Vehicles.color")}: </span>
                {vehicle.color}
              </p>
              <p>
                <span className="font-semibold">{t("Vehicles.owner")}: </span>
                {vehicle.citizen?.name} {vehicle.citizen?.surname}
              </p>
              <p>
                <span className="font-semibold">{t("Vehicles.registrationStatus")}: </span>
                {vehicle.registrationStatus.value}
              </p>
            </div>

            <div>
              <Button small onClick={() => handleManageClick(vehicle)} variant="success">
                {common("manage")}
              </Button>
              <Button
                small
                onClick={() => handleDeleteClick(vehicle)}
                className="ml-2"
                variant="danger"
              >
                {common("delete")}
              </Button>
            </div>
          </li>
        ))}
      </ul>

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
    </Tab.Panel>
  );
}
