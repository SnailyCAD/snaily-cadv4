import * as React from "react";
import { useTranslations } from "use-intl";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { Rank, RegisteredVehicle } from "@snailycad/types";
import { Table, useTableState } from "components/shared/Table";
import { FullDate } from "components/shared/FullDate";
import { Button, Loader, TextField } from "@snailycad/ui";
import { ImportModal } from "components/admin/import/ImportModal";
import { ModalIds } from "types/ModalIds";
import { useModal } from "state/modalState";
import { useAsyncTable } from "hooks/shared/table/useAsyncTable";
import type { GetImportVehiclesData, PostImportVehiclesData } from "@snailycad/types/api";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { Permissions, usePermission } from "hooks/usePermission";

interface Props {
  data: GetImportVehiclesData;
}

export default function ImportVehiclesPage({ data }: Props) {
  const t = useTranslations("Management");
  const common = useTranslations("Common");
  const veh = useTranslations("Vehicles");
  const { closeModal, openModal } = useModal();
  const { state, execute } = useFetch();
  const { hasPermissions } = usePermission();
  const hasDeletePermissions = hasPermissions([Permissions.DeleteRegisteredVehicles], true);

  const asyncTable = useAsyncTable({
    fetchOptions: {
      onResponse: (json: GetImportVehiclesData) => ({
        totalCount: json.totalCount,
        data: json.vehicles,
      }),
      path: "/admin/import/vehicles",
    },
    initialData: data.vehicles,
    totalCount: data.totalCount,
  });
  const tableState = useTableState({ pagination: asyncTable.pagination });
  const [tempVehicle, vehicleState] = useTemporaryItem(asyncTable.data);

  function handleDeleteClick(vehicle: RegisteredVehicle) {
    vehicleState.setTempId(vehicle.id);
    openModal(ModalIds.AlertDeleteVehicle);
  }

  async function handleDeleteVehicle() {
    if (!tempVehicle) return;

    const { json } = await execute({
      path: `/admin/import/vehicles/${tempVehicle.id}`,
      method: "DELETE",
    });

    if (typeof json === "boolean" && json) {
      asyncTable.setData((prevData) => prevData.filter((v) => v.id !== tempVehicle.id));
      vehicleState.setTempId(null);
      closeModal(ModalIds.AlertDeleteWeapon);
    }
  }

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
            <Button onPress={() => openModal(ModalIds.ImportVehicles)}>{t("importViaFile")}</Button>
          </div>
        </div>

        <p className="my-2 mt-5 text-neutral-700 dark:text-gray-400 max-w-2xl">
          Here you can mass-import vehicles that are registered to a citizen. In the table below you
          can also view all registered vehicles.
        </p>
      </header>

      <TextField
        label={common("search")}
        className="w-full relative"
        name="search"
        onChange={(value) => asyncTable.search.setSearch(value)}
        value={asyncTable.search.search}
        placeholder="Plate, Model, Color, ..."
      >
        {asyncTable.search.state === "loading" ? (
          <span className="absolute top-[2.4rem] right-2.5">
            <Loader />
          </span>
        ) : null}
      </TextField>

      {asyncTable.search.search && asyncTable.pagination.totalDataCount !== data.totalCount ? (
        <p className="italic text-base font-semibold">
          Showing {asyncTable.pagination.totalDataCount} result(s)
        </p>
      ) : null}

      <Table
        tableState={tableState}
        data={asyncTable.data.map((vehicle) => ({
          id: vehicle.id,
          plate: vehicle.plate,
          model: vehicle.model.value.value,
          color: vehicle.color,
          registrationStatus: vehicle.registrationStatus.value,
          vinNumber: vehicle.vinNumber,
          citizen: `${vehicle.citizen.name} ${vehicle.citizen.surname}`,
          createdAt: <FullDate>{vehicle.createdAt}</FullDate>,
          actions: (
            <Button size="xs" variant="danger" onPress={() => handleDeleteClick(vehicle)}>
              {common("delete")}
            </Button>
          ),
        }))}
        columns={[
          { header: veh("plate"), accessorKey: "plate" },
          { header: veh("model"), accessorKey: "model" },
          { header: veh("color"), accessorKey: "color" },
          { header: veh("registrationStatus"), accessorKey: "registrationStatus" },
          { header: veh("vinNumber"), accessorKey: "vinNumber" },
          { header: common("citizen"), accessorKey: "citizen" },
          { header: common("createdAt"), accessorKey: "createdAt" },
          hasDeletePermissions ? { header: common("actions"), accessorKey: "actions" } : null,
        ]}
      />

      <ImportModal<PostImportVehiclesData>
        onImport={(vehicles) => {
          asyncTable.setData((p) => [...vehicles, ...p]);
        }}
        id={ModalIds.ImportVehicles}
        url="/admin/import/vehicles/file"
      />

      {hasDeletePermissions ? (
        <AlertModal
          id={ModalIds.AlertDeleteVehicle}
          title="Delete vehicle"
          description={`Are you sure you want to delete this vehicle (${tempVehicle?.plate})? This action cannot be undone.`}
          onDeleteClick={handleDeleteVehicle}
          state={state}
        />
      ) : null}
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
