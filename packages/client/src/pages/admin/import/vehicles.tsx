import * as React from "react";
import { useTranslations } from "use-intl";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { Rank, type RegisteredVehicle } from "@snailycad/types";
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

interface Props {
  data: { totalCount: number; vehicles: RegisteredVehicle[] };
}

export default function ImportVehiclesPage({ data }: Props) {
  const t = useTranslations("Management");
  const common = useTranslations("Common");
  const veh = useTranslations("Vehicles");
  const { openModal } = useModal();

  const asyncTable = useAsyncTable({
    fetchOptions: {
      onResponse: (json) => ({ totalCount: json.totalCount, data: json.vehicles }),
      path: "/admin/import/vehicles",
    },
    initialData: data.vehicles,
    totalCount: data.totalCount,
  });

  return (
    <AdminLayout
      permissions={{
        fallback: (u) => u.rank !== Rank.USER,
        permissions: [Permissions.ImportRegisteredVehicles],
      }}
    >
      <header>
        <div className="flex items-center justify-between">
          <Title className="!mb-0">{t("IMPORT_VEHICLES")}</Title>

          <div>
            <Button onClick={() => openModal(ModalIds.ImportVehicles)}>{t("importViaFile")}</Button>
          </div>
        </div>

        <p className="my-2 mt-5 text-neutral-700 dark:text-gray-400 max-w-2xl">
          Here you can mass-import vehicles that are registered to a citizen. In the table below you
          can also view all registered vehicles.
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
        pagination={{
          enabled: true,
          totalCount: asyncTable.pagination.totalCount,
          fetchData: asyncTable.pagination,
        }}
        data={asyncTable.data.map((vehicle) => ({
          plate: vehicle.plate,
          model: vehicle.model.value.value,
          color: vehicle.color,
          registrationStatus: vehicle.registrationStatus.value,
          vinNumber: vehicle.vinNumber,
          citizen: `${vehicle.citizen.name} ${vehicle.citizen.surname}`,
          createdAt: <FullDate>{vehicle.createdAt}</FullDate>,
        }))}
        columns={[
          { Header: veh("plate"), accessor: "plate" },
          { Header: veh("model"), accessor: "model" },
          { Header: veh("color"), accessor: "color" },
          { Header: veh("registrationStatus"), accessor: "registrationStatus" },
          { Header: veh("vinNumber"), accessor: "vinNumber" },
          { Header: common("citizen"), accessor: "citizen" },
          { Header: common("createdAt"), accessor: "createdAt" },
        ]}
      />

      <ImportModal
        onImport={(vehicles) => {
          asyncTable.setData((p) => [...vehicles, ...p]);
        }}
        id={ModalIds.ImportVehicles}
        url="/admin/import/vehicles"
      />
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ locale, req }) => {
  const user = await getSessionUser(req);
  const [vehicles, values] = await requestAll(req, [
    ["/admin/import/vehicles", { vehicles: [], totalCount: 0 }],
    ["/admin/values/gender?paths=ethnicity", []],
  ]);

  return {
    props: {
      values,
      data: vehicles,
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
