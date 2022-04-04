import { FullDate } from "components/shared/FullDate";
import { Table } from "components/shared/Table";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import type { RegisteredVehicle, Weapon } from "@snailycad/types";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { useVehicleSearch, VehicleSearchResult } from "state/search/vehicleSearchState";
import { useModal } from "context/ModalContext";
import { useNameSearch } from "state/search/nameSearchState";
import { ModalIds } from "types/ModalIds";
import { useWeaponSearch } from "state/search/weaponSearchState";

interface Props {
  vehicles: RegisteredVehicle[];
  weapons: Weapon[];
}

export function VehiclesAndWeaponsSection({ vehicles, weapons }: Props) {
  const t = useTranslations();
  const common = useTranslations("Common");
  const { WEAPON_REGISTRATION } = useFeatureEnabled();
  const { currentResult } = useNameSearch();
  const { openModal } = useModal();
  const { setCurrentResult: setVehicleResult } = useVehicleSearch();
  const { setCurrentResult: setWeaponResult } = useWeaponSearch();

  function handlePlateClick(vehicle: VehicleSearchResult) {
    if (!currentResult) return;

    setVehicleResult({ ...vehicle, citizen: currentResult });
    openModal(ModalIds.VehicleSearch);
  }

  function handleWeaponClick(weapon: Weapon) {
    if (!currentResult) return;

    // todo: set correct data for `allCustomFields` and `customFields`
    setWeaponResult({ ...weapon, allCustomFields: [], customFields: [], citizen: currentResult });
    openModal(ModalIds.WeaponSearch);
  }

  return (
    <>
      <section id="vehicles" className="mt-3">
        <h3 className="text-xl font-semibold">{t("Vehicles.registeredVehicles")}</h3>

        {vehicles.length <= 0 ? (
          <p className="text-gray-400 my-2">{t("Leo.noVehiclesCitizen")}</p>
        ) : (
          <Table
            data={vehicles.map((vehicle) => ({
              plate: (
                <Button
                  title={common("openInSearch")}
                  small
                  type="button"
                  onClick={() => handlePlateClick(vehicle as VehicleSearchResult)}
                >
                  {vehicle.plate}
                </Button>
              ),
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
                model: (
                  <Button
                    title={common("openInSearch")}
                    small
                    type="button"
                    onClick={() => handleWeaponClick(weapon)}
                  >
                    {weapon.model.value.value}
                  </Button>
                ),
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
