import { FullDate } from "components/shared/FullDate";
import { Table } from "components/shared/Table";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import type { RegisteredVehicle, Weapon } from "@snailycad/types";
import { useTranslations } from "use-intl";

interface Props {
  vehicles: RegisteredVehicle[];
  weapons: Weapon[];
}

export function VehiclesAndWeaponsSection({ vehicles, weapons }: Props) {
  const t = useTranslations();
  const common = useTranslations("Common");
  const { WEAPON_REGISTRATION } = useFeatureEnabled();

  return (
    <>
      <section id="vehicles" className="mt-3">
        <h3 className="text-xl font-semibold">{t("Vehicles.registeredVehicles")}</h3>

        {vehicles.length <= 0 ? (
          <p className="text-gray-400 my-2">{t("Leo.noVehiclesCitizen")}</p>
        ) : (
          <Table
            data={vehicles.map((vehicle) => ({
              plate: vehicle.plate,
              model: vehicle.model.value.value,
              color: vehicle.color,
              registrationStatus: vehicle.registrationStatus.value,
              vinNumber: vehicle.vinNumber,
              createdAt: <FullDate>{vehicle.createdAt}</FullDate>,
            }))}
            columns={[
              { Header: t("Vehicles.plate"), accessor: "plate" },
              { Header: t("Vehicles.model"), accessor: "model" },
              { Header: t("Vehicles.color"), accessor: "color" },
              { Header: t("Vehicles.registrationStatus"), accessor: "registrationStatus" },
              { Header: t("Vehicles.vinNumber"), accessor: "vinNumber" },
              { Header: common("createdAt"), accessor: "createdAt" },
            ]}
          />
        )}
      </section>

      {WEAPON_REGISTRATION ? (
        <section id="weapons" className="mt-5">
          <h3 className="text-xl font-semibold">{t("Weapons.registeredWeapons")}</h3>

          {weapons.length <= 0 ? (
            <p className="text-gray-400 my-2">{t("Leo.noWeaponsCitizen")}</p>
          ) : (
            <Table
              data={weapons.map((weapon) => ({
                model: weapon.model.value.value,
                registrationStatus: weapon.registrationStatus.value,
                serialNumber: weapon.serialNumber,
              }))}
              columns={[
                {
                  Header: t("Weapons.model"),
                  accessor: "model",
                },
                {
                  Header: t("Weapons.registrationStatus"),
                  accessor: "registrationStatus",
                },
                {
                  Header: t("Weapons.serialNumber"),
                  accessor: "serialNumber",
                },
              ]}
            />
          )}
        </section>
      ) : null}
    </>
  );
}
