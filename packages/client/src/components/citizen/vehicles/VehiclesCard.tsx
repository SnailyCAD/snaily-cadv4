import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import type { RegisteredVehicle } from "@snailycad/types";
import { RegisterVehicleModal } from "./modals/RegisterVehicleModal";
import { ModalIds } from "types/ModalIds";
import { useModal } from "state/modalState";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { Table } from "components/shared/Table";
import { FullDate } from "components/shared/FullDate";
import { Status } from "components/shared/Status";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { TransferVehicleModal } from "./modals/TransferVehicleModal";
import { useAsyncTable } from "hooks/shared/table/useAsyncTable";
import { useCitizen } from "context/CitizenContext";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { Loader } from "components/Loader";

export function VehiclesCard(props: { vehicles: RegisteredVehicle[] }) {
  const { openModal, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Vehicles");
  const { state, execute } = useFetch();
  const { DMV } = useFeatureEnabled();
  const { citizen } = useCitizen(false);

  const [tempVehicle, setTempVehicle] = React.useState<RegisteredVehicle | null>(null);
  const asyncTable = useAsyncTable({
    fetchOptions: {
      onResponse: (json) => ({ data: json.vehicles, totalCount: json.totalCount }),
      path: `/vehicles/${citizen.id}`,
    },
    totalCount: props.vehicles.length,
    initialData: props.vehicles,
  });

  async function handleDelete() {
    if (!tempVehicle) return;

    const { json } = await execute(`/vehicles/${tempVehicle.id}`, {
      method: "DELETE",
    });

    if (json) {
      asyncTable.setData((p) => p.filter((v) => v.id !== tempVehicle.id));
      setTempVehicle(null);
      closeModal(ModalIds.AlertDeleteVehicle);
    }
  }

  function handleDeleteClick(vehicle: RegisteredVehicle) {
    setTempVehicle(vehicle);
    openModal(ModalIds.AlertDeleteVehicle);
  }

  function handleEditClick(vehicle: RegisteredVehicle) {
    setTempVehicle(vehicle);
    openModal(ModalIds.RegisterVehicle);
  }

  function handleTransferClick(vehicle: RegisteredVehicle) {
    setTempVehicle(vehicle);
    openModal(ModalIds.TransferVehicle);
  }

  return (
    <>
      <div className="p-4 card">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{t("yourVehicles")}</h1>

          <Button onClick={() => openModal(ModalIds.RegisterVehicle)} size="xs">
            {t("addVehicle")}
          </Button>
        </header>

        {props.vehicles.length <= 0 ? (
          <p className="text-neutral-700 dark:text-gray-400">{t("noVehicles")}</p>
        ) : (
          <>
            <FormField label={common("search")} className="w-full relative">
              <Input
                placeholder="john doe"
                onChange={(e) => asyncTable.search.setSearch(e.target.value)}
                value={asyncTable.search.search}
              />
              {asyncTable.state === "loading" ? (
                <span className="absolute top-[2.4rem] right-2.5">
                  <Loader />
                </span>
              ) : null}
            </FormField>

            {asyncTable.search.search &&
            asyncTable.pagination.totalCount !== props.vehicles.length ? (
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
              maxItemsPerPage={12}
              isWithinCard
              data={asyncTable.data.map((vehicle) => ({
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
                dmvStatus: (
                  <Status state={vehicle.dmvStatus}>{vehicle.dmvStatus?.toLowerCase()}</Status>
                ),
                createdAt: <FullDate>{vehicle.createdAt}</FullDate>,
                actions: (
                  <>
                    <Button
                      disabled={vehicle.impounded}
                      onClick={() => handleTransferClick(vehicle)}
                      size="xs"
                    >
                      {t("transfer")}
                    </Button>

                    <Button
                      disabled={vehicle.impounded}
                      onClick={() => handleEditClick(vehicle)}
                      size="xs"
                      className="ml-2"
                    >
                      {common("edit")}
                    </Button>

                    <Button
                      disabled={vehicle.impounded}
                      className="ml-2"
                      onClick={() => handleDeleteClick(vehicle)}
                      size="xs"
                      variant="danger"
                    >
                      {common("delete")}
                    </Button>
                  </>
                ),
              }))}
              columns={[
                { Header: t("plate"), accessor: "plate" },
                { Header: t("model"), accessor: "model" },
                { Header: t("color"), accessor: "color" },
                { Header: t("registrationStatus"), accessor: "registrationStatus" },
                { Header: t("insuranceStatus"), accessor: "insuranceStatus" },
                { Header: t("vinNumber"), accessor: "vinNumber" },
                DMV ? { Header: t("dmvStatus"), accessor: "dmvStatus" } : null,
                { Header: common("createdAt"), accessor: "createdAt" },
                { Header: common("actions"), accessor: "actions" },
              ]}
            />
          </>
        )}
      </div>

      <RegisterVehicleModal
        onCreate={(weapon) => {
          closeModal(ModalIds.RegisterVehicle);
          asyncTable.setData((p) => [...p, weapon]);
        }}
        onUpdate={(old, newW) => {
          asyncTable.setData((p) => {
            const idx = p.indexOf(old);
            p[idx] = newW;
            return p;
          });
          closeModal(ModalIds.RegisterVehicle);
        }}
        vehicle={tempVehicle}
        onClose={() => setTempVehicle(null)}
      />

      <AlertModal
        className="w-[600px]"
        title={t("deleteVehicle")}
        id={ModalIds.AlertDeleteVehicle}
        description={t("alert_deleteVehicle")}
        onDeleteClick={handleDelete}
        state={state}
        onClose={() => setTempVehicle(null)}
      />

      {tempVehicle ? (
        <TransferVehicleModal
          onTransfer={(vehicle) => {
            setTempVehicle(null);
            asyncTable.setData((prev) => prev.filter((v) => v.id !== vehicle.id));
          }}
          vehicle={tempVehicle}
        />
      ) : null}
    </>
  );
}
