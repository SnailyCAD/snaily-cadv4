import * as React from "react";
import { useTranslations } from "use-intl";
import { Button, FullDate } from "@snailycad/ui";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { makeUnitName, requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import type { ImpoundedVehicle } from "@snailycad/types";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import { Title } from "components/shared/Title";
import { usePermission, Permissions } from "hooks/usePermission";
import type { GetLeoImpoundedVehiclesData } from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { AllowImpoundedVehicleCheckoutModal } from "components/leo/modals/AllowImpoundedVehicleCheckoutModal";
import { SearchArea } from "components/shared/search/search-area";
import { VehicleSearchModal } from "components/leo/modals/VehicleSearchModal";
import { NameSearchModal } from "components/leo/modals/NameSearchModal/NameSearchModal";
import { CallDescription } from "components/dispatch/active-calls/CallDescription";

interface Props {
  vehicles: GetLeoImpoundedVehiclesData;
}

export default function ImpoundLot({ vehicles: data }: Props) {
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const modalState = useModal();
  const [search, setSearch] = React.useState("");

  const { hasPermissions } = usePermission();
  const hasManagePermissions = hasPermissions([Permissions.ManageImpoundLot]);
  const { generateCallsign } = useGenerateCallsign();

  const asyncTable = useAsyncTable<GetLeoImpoundedVehiclesData["vehicles"][number]>({
    search,
    fetchOptions: {
      onResponse(json: GetLeoImpoundedVehiclesData) {
        return { data: json.vehicles, totalCount: json.totalCount };
      },
      path: "/leo/impounded-vehicles",
    },
    initialData: data.vehicles,
    totalCount: data.totalCount,
  });
  const tableState = useTableState({ pagination: asyncTable.pagination });
  const [tempVehicle, vehicleState] = useTemporaryItem(asyncTable.items);

  function handleCheckoutClick(item: ImpoundedVehicle) {
    vehicleState.setTempId(item.id);
    modalState.openModal(ModalIds.AlertCheckoutImpoundedVehicle);
  }

  function handlePlatePress(item: ImpoundedVehicle) {
    modalState.openModal(ModalIds.VehicleSearch, item.vehicle);
  }

  return (
    <Layout
      permissions={{
        permissions: [Permissions.ViewImpoundLot, Permissions.ManageImpoundLot],
      }}
      className="dark:text-white"
    >
      <Title>{t("impoundLot")}</Title>

      <SearchArea
        asyncTable={asyncTable}
        search={{ search, setSearch }}
        totalCount={data.totalCount}
      />

      {asyncTable.items.length <= 0 ? (
        <p className="mt-5">{t("noImpoundedVehicles")}</p>
      ) : (
        <Table
          tableState={tableState}
          data={asyncTable.items.map((item) => ({
            id: item.id,
            plate: (
              <Button size="xs" onPress={() => handlePlatePress(item)}>
                {item.vehicle.plate}
              </Button>
            ),
            model: item.vehicle.model.value.value,
            owner: item.vehicle.citizen
              ? `${item.vehicle.citizen.name} ${item.vehicle.citizen.surname}`
              : common("unknown"),
            location: item.location.value,
            impoundedBy: item.officer
              ? `${generateCallsign(item.officer)} ${makeUnitName(item.officer)}`
              : "—",
            impoundedAt: <FullDate>{item.createdAt}</FullDate>,
            description: <CallDescription data={item} />,
            actions: (
              <Button onPress={() => handleCheckoutClick(item)} className="ml-2" size="xs">
                {t("allowCheckout")}
              </Button>
            ),
          }))}
          columns={[
            { header: t("plate"), accessorKey: "plate" },
            { header: t("model"), accessorKey: "model" },
            { header: t("owner"), accessorKey: "owner" },
            { header: t("location"), accessorKey: "location" },
            { header: t("impoundedBy"), accessorKey: "impoundedBy" },
            { header: t("impoundedAt"), accessorKey: "impoundedAt" },
            { header: common("description"), accessorKey: "description" },
            hasManagePermissions ? { header: common("actions"), accessorKey: "actions" } : null,
          ]}
        />
      )}

      <AllowImpoundedVehicleCheckoutModal
        onCheckout={(vehicle) => {
          asyncTable.remove(vehicle.id);
          vehicleState.setTempId(null);
        }}
        vehicle={tempVehicle}
      />
      <VehicleSearchModal />
      <NameSearchModal />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  const [vehicles] = await requestAll(req, [["/leo/impounded-vehicles", []]]);

  return {
    props: {
      session: user,
      vehicles,
      messages: {
        ...(await getTranslations(
          ["leo", "common", "citizen", "truck-logs"],
          user?.locale ?? locale,
        )),
      },
    },
  };
};
