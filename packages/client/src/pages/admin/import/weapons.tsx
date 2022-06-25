import * as React from "react";
import { useTranslations } from "use-intl";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { Citizen, Rank, Weapon } from "@snailycad/types";
import { Table } from "components/shared/Table";
import { FullDate } from "components/shared/FullDate";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { Button } from "components/Button";
import { ImportModal } from "components/admin/import/ImportModal";
import { ModalIds } from "types/ModalIds";
import { useModal } from "state/modalState";
import { Permissions } from "@snailycad/permissions";
import { useAsyncTable } from "hooks/shared/table/useAsyncTable";
import type { PostImportWeaponsData } from "@snailycad/types/api";

interface Props {
  data: { weapons: (Weapon & { citizen: Citizen })[]; totalCount: number };
}

export default function ImportWeaponsPage({ data }: Props) {
  const t = useTranslations("Management");
  const common = useTranslations("Common");
  const wep = useTranslations("Weapons");
  const { openModal } = useModal();

  const asyncTable = useAsyncTable({
    fetchOptions: {
      onResponse: (json) => ({ totalCount: json.totalCount, data: json.weapons }),
      path: "/admin/import/weapons",
    },
    initialData: data.weapons,
    totalCount: data.totalCount,
  });

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
            <Button onClick={() => openModal(ModalIds.ImportWeapons)}>{t("importViaFile")}</Button>
          </div>
        </div>

        <p className="my-2 mt-5 text-neutral-700 dark:text-gray-400 max-w-2xl">
          Here you can mass-import weapons that are registered to a citizen. In the table below you
          can also view all registered weapons.
        </p>
      </header>

      <FormField label={common("search")} className="my-2 w-full">
        <Input
          className="w-full"
          placeholder="filter by plate, model, color, etc."
          onChange={(e) => asyncTable.search.setSearch(e.target.value)}
          value={asyncTable.search.search}
        />
      </FormField>

      {asyncTable.search.search && asyncTable.pagination.totalCount !== data.totalCount ? (
        <p className="italic text-base font-semibold">
          Showing {asyncTable.pagination.totalCount} result(s)
        </p>
      ) : null}

      <Table
        data={asyncTable.data.map((weapon) => ({
          model: weapon.model.value.value,
          registrationStatus: weapon.registrationStatus.value,
          serialNumber: weapon.serialNumber,
          citizen: `${weapon.citizen.name} ${weapon.citizen.surname}`,
          createdAt: <FullDate>{weapon.createdAt}</FullDate>,
        }))}
        columns={[
          { Header: wep("model"), accessor: "model" },
          { Header: wep("registrationStatus"), accessor: "registrationStatus" },
          { Header: wep("serialNumber"), accessor: "serialNumber" },
          { Header: common("citizen"), accessor: "citizen" },
          { Header: common("createdAt"), accessor: "createdAt" },
        ]}
      />

      <ImportModal<PostImportWeaponsData>
        onImport={(weapons) => {
          asyncTable.setData((p) => [...weapons, ...p]);
        }}
        id={ModalIds.ImportWeapons}
        url="/admin/import/weapons"
      />
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
