import * as React from "react";
import { CustomFieldCategory } from "@snailycad/types";
import { Button } from "components/Button";
import { Table } from "components/shared/Table";
import { useModal } from "state/modalState";
import { useTranslations } from "next-intl";
import { NameSearchResult, useNameSearch } from "state/search/nameSearchState";
import { useVehicleSearch, VehicleSearchResult } from "state/search/vehicleSearchState";
import { useWeaponSearch, WeaponSearchResult } from "state/search/weaponSearchState";
import { ModalIds } from "types/ModalIds";
import type { CustomFieldResults } from "./CustomFieldSearch";

interface Props {
  results: CustomFieldResults;
}

const components = {
  [CustomFieldCategory.CITIZEN]: CitizenResults,
  [CustomFieldCategory.VEHICLE]: VehicleResults,
  [CustomFieldCategory.WEAPON]: WeaponResults,
} as const;

export function CustomFieldResults({ results }: Props) {
  const t = useTranslations("Leo");

  const Component = React.useMemo(
    () => components[results.field.category],
    [results.field.category],
  );

  if (results.results.length <= 0) {
    return (
      <div className="mt-3">
        <p>{t("noCustomFieldResults")}</p>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <Component results={results.results} />
    </div>
  );
}

function CitizenResults({ results }: any) {
  const { openModal, closeModal } = useModal();
  const { setCurrentResult } = useNameSearch();
  const t = useTranslations("Leo");
  const common = useTranslations("Common");

  const citizens = results as NameSearchResult[];

  function handleOpen(citizen: any) {
    closeModal(ModalIds.CustomFieldSearch);
    openModal(ModalIds.NameSearch, { name: `${citizen.name} ${citizen.surname}` });
    setCurrentResult(citizen);
  }

  return (
    <Table
      data={citizens.map((result) => ({
        citizen: `${result.name} ${result.surname}`,
        actions: (
          <Button type="button" onClick={() => handleOpen(result)} small>
            {t("viewInNameSearch")}
          </Button>
        ),
      }))}
      columns={[
        { Header: t("citizen"), accessor: "citizen" },
        { Header: common("actions"), accessor: "actions" },
      ]}
    />
  );
}

function WeaponResults({ results }: any) {
  const { openModal, closeModal } = useModal();
  const { setCurrentResult } = useWeaponSearch();
  const t = useTranslations();

  const citizens = results as WeaponSearchResult[];

  function handleOpen(weapon: any) {
    closeModal(ModalIds.CustomFieldSearch);
    openModal(ModalIds.WeaponSearch);
    setCurrentResult(weapon);
  }

  return (
    <Table
      data={citizens.map((result) => ({
        weapon: (
          <Button type="button" small onClick={() => handleOpen(result)}>
            {result.model.value.value}
          </Button>
        ),
        serialNumber: `${result.serialNumber}`,
        owner: `${result.citizen.name} ${result.citizen.surname}`,
      }))}
      columns={[
        { Header: t("Weapons.model"), accessor: "weapon" },
        { Header: t("Weapons.serialNumber"), accessor: "serialNumber" },
        { Header: t("Leo.owner"), accessor: "owner" },
      ]}
    />
  );
}

function VehicleResults({ results }: any) {
  const { openModal, closeModal } = useModal();
  const { setCurrentResult } = useVehicleSearch();
  const t = useTranslations();

  const citizens = results as VehicleSearchResult[];

  function handleOpen(vehicle: any) {
    closeModal(ModalIds.CustomFieldSearch);
    openModal(ModalIds.VehicleSearch);
    setCurrentResult(vehicle);
  }

  return (
    <Table
      data={citizens.map((result) => ({
        model: (
          <Button type="button" small onClick={() => handleOpen(result)}>
            {result.model.value.value}
          </Button>
        ),
        vinNumber: `${result.vinNumber}`,
        owner: `${result.citizen.name} ${result.citizen.surname}`,
      }))}
      columns={[
        { Header: t("Vehicles.model"), accessor: "model" },
        { Header: t("Vehicles.vinNumber"), accessor: "vinNumber" },
        { Header: t("Leo.owner"), accessor: "owner" },
      ]}
    />
  );
}
