import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "@snailycad/ui";
import type { RegisteredVehicle } from "@snailycad/types";
import { ModalIds } from "types/ModalIds";
import { useModal } from "state/modalState";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { Table, useTableState } from "components/shared/Table";
import { FullDate } from "components/shared/FullDate";
import { Status } from "components/shared/Status";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useAsyncTable } from "hooks/shared/table/use-async-table";
import { useCitizen } from "context/CitizenContext";
import type { DeleteCitizenVehicleData, GetCitizenVehiclesData } from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { SearchArea } from "components/shared/search/search-area";
import dynamic from "next/dynamic";

const RegisterVehicleModal = dynamic(
  async () => (await import("./modals/register-vehicle-modal")).RegisterVehicleModal,
  { ssr: false },
);
const TransferVehicleModal = dynamic(
  async () => (await import("./modals/transfer-vehicle-modal")).TransferVehicleModal,
  { ssr: false },
);

export function VehiclesCard(props: { vehicles: RegisteredVehicle[] }) {
  const [search, setSearch] = React.useState("");

  const { openModal, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Vehicles");
  const { state, execute } = useFetch();
  const { DMV } = useFeatureEnabled();
  const { citizen } = useCitizen(false);

  const asyncTable = useAsyncTable({
    search,
    scrollToTopOnDataChange: false,
    fetchOptions: {
      pageSize: 12,
      onResponse: (json: GetCitizenVehiclesData) => ({
        data: json.vehicles,
        totalCount: json.totalCount,
      }),
      path: `/vehicles/${citizen.id}`,
    },
    totalCount: props.vehicles.length,
    initialData: props.vehicles,
  });
  const tableState = useTableState({ pagination: asyncTable.pagination });

  const [tempVehicle, vehicleState] = useTemporaryItem(asyncTable.items);

  async function handleDelete() {
    if (!tempVehicle) return;

    const { json } = await execute<DeleteCitizenVehicleData>({
      path: `/vehicles/${tempVehicle.id}`,
      method: "DELETE",
    });

    if (json) {
      asyncTable.remove(tempVehicle.id);
      vehicleState.setTempId(null);
      closeModal(ModalIds.AlertDeleteVehicle);
    }
  }

  function handleDeleteClick(vehicle: RegisteredVehicle) {
    vehicleState.setTempId(vehicle.id);
    openModal(ModalIds.AlertDeleteVehicle);
  }

  function handleEditClick(vehicle: RegisteredVehicle) {
    vehicleState.setTempId(vehicle.id);
    openModal(ModalIds.RegisterVehicle);
  }

  function handleTransferClick(vehicle: RegisteredVehicle) {
    vehicleState.setTempId(vehicle.id);
    openModal(ModalIds.TransferVehicle);
  }

  return (
    <>
      <div className="p-4 card">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{t("yourVehicles")}</h1>

          <Button onPress={() => openModal(ModalIds.RegisterVehicle)} size="xs">
            {t("addVehicle")}
          </Button>
        </header>

        <SearchArea
          asyncTable={asyncTable}
          search={{ search, setSearch }}
          totalCount={props.vehicles.length}
        />

        {asyncTable.items.length <= 0 ? (
          <p className="text-neutral-700 dark:text-gray-400">{t("noVehicles")}</p>
        ) : (
          <Table
            tableState={tableState}
            features={{ isWithinCardOrModal: true }}
            data={asyncTable.items.map((vehicle) => ({
              id: vehicle.id,
              rowProps: {
                title: vehicle.impounded ? t("vehicleImpounded") : undefined,
                className: vehicle.impounded ? "opacity-50" : undefined,
              },
              plate: vehicle.plate,
              model: vehicle.model.value.value,
              color: vehicle.color,
              registrationStatus: vehicle.registrationStatus.value,
              insuranceStatus: vehicle.insuranceStatus?.value ?? common("none"),
              vinNumber: vehicle.vinNumber,
              dmvStatus: <Status fallback="—">{vehicle.dmvStatus}</Status>,
              createdAt: <FullDate>{vehicle.createdAt}</FullDate>,
              actions: (
                <>
                  <Button
                    disabled={vehicle.impounded}
                    onPress={() => handleTransferClick(vehicle)}
                    size="xs"
                  >
                    {t("transfer")}
                  </Button>

                  <Button
                    disabled={vehicle.impounded}
                    onPress={() => handleEditClick(vehicle)}
                    size="xs"
                    className="ml-2"
                  >
                    {common("edit")}
                  </Button>

                  <Button
                    disabled={vehicle.impounded}
                    className="ml-2"
                    onPress={() => handleDeleteClick(vehicle)}
                    size="xs"
                    variant="danger"
                  >
                    {common("delete")}
                  </Button>
                </>
              ),
            }))}
            columns={[
              { header: t("plate"), accessorKey: "plate" },
              { header: t("model"), accessorKey: "model" },
              { header: t("color"), accessorKey: "color" },
              { header: t("registrationStatus"), accessorKey: "registrationStatus" },
              { header: t("insuranceStatus"), accessorKey: "insuranceStatus" },
              { header: t("vinNumber"), accessorKey: "vinNumber" },
              DMV ? { header: t("dmvStatus"), accessorKey: "dmvStatus" } : null,
              { header: common("createdAt"), accessorKey: "createdAt" },
              { header: common("actions"), accessorKey: "actions" },
            ]}
          />
        )}
      </div>

      <RegisterVehicleModal
        onCreate={(vehicle) => {
          closeModal(ModalIds.RegisterVehicle);
          asyncTable.append(vehicle);
        }}
        onUpdate={(previousVehicle, newVehicle) => {
          asyncTable.update(previousVehicle.id, newVehicle);
          closeModal(ModalIds.RegisterVehicle);
        }}
        vehicle={tempVehicle}
        onClose={() => vehicleState.setTempId(null)}
      />

      <AlertModal
        className="w-[600px]"
        title={t("deleteVehicle")}
        id={ModalIds.AlertDeleteVehicle}
        description={t.rich("alert_deleteVehicle")}
        onDeleteClick={handleDelete}
        state={state}
        onClose={() => vehicleState.setTempId(null)}
      />

      {tempVehicle ? (
        <TransferVehicleModal
          onTransfer={(vehicle) => {
            vehicleState.setTempId(null);
            asyncTable.remove(vehicle.id);
          }}
          vehicle={tempVehicle}
        />
      ) : null}
    </>
  );
}
