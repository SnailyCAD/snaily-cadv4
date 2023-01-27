import * as React from "react";
import { CustomFieldCategory } from "@snailycad/types";
import { Button } from "@snailycad/ui";
import { Table, useTableState } from "components/shared/Table";
import { useModal } from "state/modalState";
import { useTranslations } from "next-intl";
import { NameSearchResult, useNameSearch } from "state/search/name-search-state";
import { useVehicleSearch, VehicleSearchResult } from "state/search/vehicle-search-state";
import { useWeaponSearch, WeaponSearchResult } from "state/search/weapon-search-state";
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
    () => results.field && components[results.field.category],
    [results.field],
  );

  if (results.results.length <= 0 || !Component) {
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
  const setCurrentResult = useNameSearch((state) => state.setCurrentResult);
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const tableState = useTableState();

  const citizens = results as NameSearchResult[];

  function handleOpen(citizen: any) {
    closeModal(ModalIds.CustomFieldSearch);
    openModal(ModalIds.NameSearch, {
      ...citizen,
      name: `${citizen.name} ${citizen.surname}`,
    });
    setCurrentResult(citizen);
  }

  return (
    <Table
      tableState={tableState}
      data={citizens.map((result) => ({
        id: result.id,
        citizen: `${result.name} ${result.surname}`,
        actions: (
          <Button type="button" onPress={() => handleOpen(result)} size="xs">
            {t("viewInNameSearch")}
          </Button>
        ),
      }))}
      columns={[
        { header: t("citizen"), accessorKey: "citizen" },
        { header: common("actions"), accessorKey: "actions" },
      ]}
    />
  );
}

function WeaponResults({ results }: any) {
  const { openModal, closeModal } = useModal();
  const setCurrentResult = useWeaponSearch((state) => state.setCurrentResult);
  const t = useTranslations();
  const tableState = useTableState();

  const citizens = results as NonNullable<WeaponSearchResult>[];

  function handleOpen(weapon: any) {
    closeModal(ModalIds.CustomFieldSearch);
    openModal(ModalIds.WeaponSearch);
    setCurrentResult(weapon);
  }

  return (
    <Table
      tableState={tableState}
      data={citizens.map((result) => ({
        id: result.id,
        weapon: (
          <Button type="button" size="xs" onPress={() => handleOpen(result)}>
            {result.model.value.value}
          </Button>
        ),
        serialNumber: `${result.serialNumber}`,
        owner: `${result.citizen.name} ${result.citizen.surname}`,
      }))}
      columns={[
        { header: t("Weapons.model"), accessorKey: "weapon" },
        { header: t("Weapons.serialNumber"), accessorKey: "serialNumber" },
        { header: t("Leo.owner"), accessorKey: "owner" },
      ]}
    />
  );
}

function VehicleResults({ results }: any) {
  const { openModal, closeModal } = useModal();
  const setCurrentResult = useVehicleSearch((state) => state.setCurrentResult);
  const t = useTranslations();
  const tableState = useTableState();

  const citizens = results as VehicleSearchResult[];

  function handleOpen(vehicle: any) {
    closeModal(ModalIds.CustomFieldSearch);
    openModal(ModalIds.VehicleSearch);
    setCurrentResult(vehicle);
  }

  return (
    <Table
      tableState={tableState}
      data={citizens.map((result) => ({
        id: result.id,
        model: (
          <Button type="button" size="xs" onPress={() => handleOpen(result)}>
            {result.model.value.value}
          </Button>
        ),
        vinNumber: `${result.vinNumber}`,
        owner: result.citizen
          ? `${result.citizen.name} ${result.citizen.surname}`
          : t("Common.unknown"),
      }))}
      columns={[
        { header: t("Vehicles.model"), accessorKey: "model" },
        { header: t("Vehicles.vinNumber"), accessorKey: "vinNumber" },
        { header: t("Leo.owner"), accessorKey: "owner" },
      ]}
    />
  );
}
