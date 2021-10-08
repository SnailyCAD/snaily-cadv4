import * as React from "react";
import { Button } from "components/Button";
import { RegisteredVehicle } from "types/prisma";
import { RegisterVehicleModal } from "./RegisterVehicleModal";
import { ModalIds } from "types/ModalIds";
import { useModal } from "context/ModalContext";
import { useTranslations } from "use-intl";

export const VehiclesCard = (props: { vehicles: RegisteredVehicle[] }) => {
  const { openModal, closeModal } = useModal();
  const common = useTranslations("common");
  const t= useTranslations("Vehicle")

  const [vehicles, setVehicles] = React.useState<RegisteredVehicle[]>(props.vehicles);
  const [tempVehicle, setTempVehicle] = React.useState<RegisteredVehicle | null>(null);

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
          <table className="table max-h-64 mt-5">
            <thead>
              <tr>
                <th>{t("plate")}</th>
                <th>{t("model")}</th>
                <th>{t("color")}</th>
                <th>{t("registrationStatus")}</th>
                <th>{common("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td>{vehicle.plate.toUpperCase()}</td>
                  <td>{vehicle.model}</td>
                  <td>{vehicle.color}</td>
                  <td>{vehicle.registrationStatus}</td>
                  <td>
                    <Button small variant="danger">
                      {common("delete")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <RegisterVehicleModal
        onCreate={(weapon) => {
          closeModal(ModalIds.RegisterWeapon);
          setVehicles((p) => [...p, weapon]);
        }}
        onUpdate={(old, newW) => {
          setVehicles((p) => {
            const idx = p.indexOf(old);
            p[idx] = newW;
            return p;
          });
          closeModal(ModalIds.RegisterWeapon);
        }}
        vehicle={tempVehicle}
        // todo
        citizens={[]}
      />
    </>
  );
};
