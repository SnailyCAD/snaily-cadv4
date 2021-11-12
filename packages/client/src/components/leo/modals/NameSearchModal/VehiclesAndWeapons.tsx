import format from "date-fns/format";
import { RegisteredVehicle, Weapon } from "types/prisma";
import { useTranslations } from "use-intl";

interface Props {
  vehicles: RegisteredVehicle[];
  weapons: Weapon[];
}

export const VehiclesAndWeaponsSection = ({ vehicles, weapons }: Props) => {
  const t = useTranslations();
  const common = useTranslations("Common");

  return (
    <>
      <section id="vehicles" className="mt-3">
        <h3 className="text-xl font-semibold">{t("Vehicles.registeredVehicles")}</h3>

        {vehicles.length <= 0 ? (
          <p>{t("Leo.noVehiclesCitizen")}</p>
        ) : (
          <div className="w-full mt-3 overflow-x-auto">
            <table className="w-full overflow-hidden whitespace-nowrap max-h-64">
              <thead>
                <tr>
                  <th>{t("Vehicles.plate")}</th>
                  <th>{t("Vehicles.model")}</th>
                  <th>{t("Vehicles.color")}</th>
                  <th>{t("Vehicles.registrationStatus")}</th>
                  <th>{t("Vehicles.vinNumber")}</th>
                  <th>{common("createdAt")}</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td>{vehicle.plate.toUpperCase()}</td>
                    <td>{vehicle.model.value.value}</td>
                    <td>{vehicle.color}</td>
                    <td>{vehicle.registrationStatus.value}</td>
                    <td>{vehicle.vinNumber}</td>
                    <td>{format(new Date(vehicle.createdAt), "yyyy-MM-dd")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section id="weapons" className="mt-5">
        <h3 className="text-xl font-semibold">{t("Weapons.registeredWeapons")}</h3>

        {weapons.length <= 0 ? (
          <p>{t("Leo.noWeaponsCitizen")}</p>
        ) : (
          <div className="w-full mt-3 overflow-x-auto">
            <table className="w-full overflow-hidden whitespace-nowrap max-h-64">
              <thead>
                <tr>
                  <th>{t("Weapons.model")}</th>
                  <th>{t("Weapons.registrationStatus")}</th>
                  <th>{t("Weapons.serialNumber")}</th>
                </tr>
              </thead>
              <tbody>
                {weapons.map((weapon) => (
                  <tr key={weapon.id}>
                    <td>{weapon.model.value.value}</td>
                    <td>{weapon.registrationStatus.value}</td>
                    <td>{weapon.serialNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
};
