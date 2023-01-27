import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "@snailycad/ui";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { makeUnitName, requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import type { ImpoundedVehicle } from "@snailycad/types";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { Table, useTableState } from "components/shared/Table";
import { Title } from "components/shared/Title";
import { usePermission, Permissions } from "hooks/usePermission";
import type { GetLeoImpoundedVehiclesData } from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { FullDate } from "components/shared/FullDate";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { AllowImpoundedVehicleCheckoutModal } from "components/leo/modals/AllowImpoundedVehicleCheckoutModal";

interface Props {
  vehicles: GetLeoImpoundedVehiclesData;
}

export default function ImpoundLot({ vehicles: data }: Props) {
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { openModal } = useModal();

  const { hasPermissions } = usePermission();
  const hasManagePermissions = hasPermissions([Permissions.ManageImpoundLot], true);
  const tableState = useTableState();
  const { generateCallsign } = useGenerateCallsign();

  const [vehicles, setVehicles] = React.useState(data);
  const [tempVehicle, vehicleState] = useTemporaryItem(vehicles);

  function handleCheckoutClick(item: ImpoundedVehicle) {
    vehicleState.setTempId(item.id);
    openModal(ModalIds.AlertCheckoutImpoundedVehicle);
  }

  return (
    <Layout
      permissions={{
        fallback: (u) => u.isLeo,
        permissions: [Permissions.ViewImpoundLot, Permissions.ManageImpoundLot],
      }}
      className="dark:text-white"
    >
      <Title>{t("impoundLot")}</Title>

      {vehicles.length <= 0 ? (
        <p className="mt-5">{t("noImpoundedVehicles")}</p>
      ) : (
        <Table
          tableState={tableState}
          data={vehicles.map((item) => ({
            id: item.id,
            plate: item.vehicle.plate,
            model: item.vehicle.model.value.value,
            owner: item.vehicle.citizen
              ? `${item.vehicle.citizen.name} ${item.vehicle.citizen.surname}`
              : common("unknown"),
            location: item.location.value,
            impoundedBy: item.officer
              ? `${generateCallsign(item.officer)} ${makeUnitName(item.officer)}`
              : "—",
            impoundedAt: <FullDate>{item.createdAt}</FullDate>,
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
            hasManagePermissions ? { header: common("actions"), accessorKey: "actions" } : null,
          ]}
        />
      )}

      <AllowImpoundedVehicleCheckoutModal
        onCheckout={(vehicle) => {
          setVehicles((p) => p.filter((v) => v.id !== vehicle.id));
          vehicleState.setTempId(null);
        }}
        vehicle={tempVehicle}
      />
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
        ...(await getTranslations(["leo", "common"], user?.locale ?? locale)),
      },
    },
  };
};
