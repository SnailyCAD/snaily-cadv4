import * as React from "react";
import { useTranslations } from "use-intl";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { Rank, Weapon } from "@snailycad/types";
import { Table, useTableState } from "components/shared/Table";
import { FullDate } from "components/shared/FullDate";
import { Button } from "@snailycad/ui";
import { ImportModal } from "components/admin/import/ImportModal";
import { ModalIds } from "types/ModalIds";
import { useModal } from "state/modalState";
import { useAsyncTable } from "hooks/shared/table/use-async-table";
import type { GetImportWeaponsData, PostImportWeaponsData } from "@snailycad/types/api";
import { AlertModal } from "components/modal/AlertModal";
import { Permissions, usePermission } from "hooks/usePermission";
import useFetch from "lib/useFetch";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { SearchArea } from "components/shared/search/search-area";

interface Props {
  data: GetImportWeaponsData;
}

export default function ImportWeaponsPage({ data }: Props) {
  const [search, setSearch] = React.useState("");

  const t = useTranslations("Management");
  const common = useTranslations("Common");
  const wep = useTranslations("Weapons");
  const { closeModal, openModal } = useModal();
  const { state, execute } = useFetch();
  const { hasPermissions } = usePermission();
  const hasDeletePermissions = hasPermissions([Permissions.DeleteRegisteredWeapons], true);

  const asyncTable = useAsyncTable({
    search,
    fetchOptions: {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      onResponse: (json: GetImportWeaponsData) => ({
        totalCount: json.totalCount,
        data: json.weapons,
      }),
      path: "/admin/import/weapons",
    },
    initialData: data.weapons,
    totalCount: data.totalCount,
  });
  const tableState = useTableState({ pagination: asyncTable.pagination });
  const [tempWeapon, weaponState] = useTemporaryItem(asyncTable.items);

  function handleDeleteClick(weapon: Weapon) {
    weaponState.setTempId(weapon.id);
    openModal(ModalIds.AlertDeleteWeapon);
  }

  async function handleDeleteWeapon() {
    if (!tempWeapon) return;

    const { json } = await execute({
      path: `/admin/import/weapons/${tempWeapon.id}`,
      method: "DELETE",
    });

    if (typeof json === "boolean" && json) {
      asyncTable.remove(tempWeapon.id);
      weaponState.setTempId(null);
      closeModal(ModalIds.AlertDeleteWeapon);
    }
  }

  return (
    <AdminLayout
      permissions={{
        fallback: (u) => u.rank !== Rank.USER,
        permissions: [Permissions.ImportRegisteredWeapons],
      }}
    >
      <header>
        <div className="flex items-center justify-between">
          <Title className="!mb-0">{t("IMPORT_WEAPONS")}</Title>

          <div>
            <Button onPress={() => openModal(ModalIds.ImportWeapons)}>{t("importViaFile")}</Button>
          </div>
        </div>

        <p className="my-2 mt-5 text-neutral-700 dark:text-gray-400 max-w-2xl">
          {t("importWeaponsDescription")}
        </p>
      </header>

      <SearchArea
        search={{ search, setSearch }}
        asyncTable={asyncTable}
        totalCount={data.totalCount}
      />

      <Table
        tableState={tableState}
        data={asyncTable.items.map((weapon) => ({
          id: weapon.id,
          model: weapon.model.value.value,
          registrationStatus: weapon.registrationStatus.value,
          serialNumber: weapon.serialNumber,
          citizen: `${weapon.citizen.name} ${weapon.citizen.surname}`,
          createdAt: <FullDate>{weapon.createdAt}</FullDate>,
          actions: (
            <Button size="xs" variant="danger" onPress={() => handleDeleteClick(weapon)}>
              {common("delete")}
            </Button>
          ),
        }))}
        columns={[
          { header: wep("model"), accessorKey: "model" },
          { header: wep("registrationStatus"), accessorKey: "registrationStatus" },
          { header: wep("serialNumber"), accessorKey: "serialNumber" },
          { header: common("citizen"), accessorKey: "citizen" },
          { header: common("createdAt"), accessorKey: "createdAt" },
          hasDeletePermissions ? { header: common("actions"), accessorKey: "actions" } : null,
        ]}
      />

      <ImportModal<PostImportWeaponsData>
        onImport={(weapons) => asyncTable.append(...weapons)}
        id={ModalIds.ImportWeapons}
        url="/admin/import/weapons/file"
      />

      {hasDeletePermissions ? (
        <AlertModal
          id={ModalIds.AlertDeleteWeapon}
          title="Delete weapon"
          description={`Are you sure you want to delete this weapon (${tempWeapon?.serialNumber})? This action cannot be undone.`}
          onDeleteClick={handleDeleteWeapon}
          state={state}
        />
      ) : null}
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ locale, req }) => {
  const user = await getSessionUser(req);
  const [weapons, values] = await requestAll(req, [
    ["/admin/import/weapons", { weapons: [], totalCount: 0 }],
    ["/admin/values/gender?paths=ethnicity", []],
  ]);

  return {
    props: {
      values,
      data: weapons,
      session: user,
      messages: {
        ...(await getTranslations(
          ["citizen", "admin", "values", "common"],
          user?.locale ?? locale,
        )),
      },
    },
  };
};
