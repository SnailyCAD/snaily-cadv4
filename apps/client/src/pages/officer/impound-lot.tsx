import * as React from "react";
import { useTranslations } from "use-intl";
import { Loader, Button } from "@snailycad/ui";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import type { ImpoundedVehicle } from "@snailycad/types";
import { useModal } from "state/modalState";
import { Modal } from "components/modal/Modal";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { Table, useTableState } from "components/shared/Table";
import { Title } from "components/shared/Title";
import { usePermission, Permissions } from "hooks/usePermission";
import type {
  DeleteLeoCheckoutImpoundedVehicleData,
  GetLeoImpoundedVehiclesData,
} from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";

interface Props {
  vehicles: GetLeoImpoundedVehiclesData;
}

export default function ImpoundLot({ vehicles: data }: Props) {
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { isOpen, closeModal, openModal } = useModal();
  const { state, execute } = useFetch();
  const { hasPermissions } = usePermission();
  const hasManagePermissions = hasPermissions([Permissions.ManageImpoundLot], true);
  const tableState = useTableState();

  const [vehicles, setVehicles] = React.useState(data);
  const [tempVehicle, vehicleState] = useTemporaryItem(vehicles);

  async function handleCheckout() {
    if (!tempVehicle) return;

    const { json } = await execute<DeleteLeoCheckoutImpoundedVehicleData>({
      path: `/leo/impounded-vehicles/${tempVehicle.id}`,
      method: "DELETE",
    });

    if (typeof json === "boolean") {
      setVehicles((p) => p.filter((v) => v.id !== tempVehicle.id));
      vehicleState.setTempId(null);
      closeModal(ModalIds.AlertCheckoutImpoundedVehicle);
    }
  }

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
            location: item.location.value,
            actions: (
              <Button onPress={() => handleCheckoutClick(item)} className="ml-2" size="xs">
                {t("allowCheckout")}
              </Button>
            ),
          }))}
          columns={[
            { header: t("plate"), accessorKey: "plate" },
            { header: t("model"), accessorKey: "model" },
            { header: t("location"), accessorKey: "location" },
            hasManagePermissions ? { header: common("actions"), accessorKey: "actions" } : null,
          ]}
        />
      )}

      <Modal
        title={t("allowCheckout")}
        onClose={() => closeModal(ModalIds.AlertCheckoutImpoundedVehicle)}
        isOpen={isOpen(ModalIds.AlertCheckoutImpoundedVehicle)}
      >
        <p className="my-3">{t("alert_allowCheckout")}</p>
        <div className="flex items-center justify-end gap-2 mt-2">
          <Button
            variant="cancel"
            disabled={state === "loading"}
            onPress={() => closeModal(ModalIds.AlertCheckoutImpoundedVehicle)}
          >
            {common("no")}
          </Button>
          <Button
            disabled={state === "loading"}
            className="flex items-center"
            onPress={handleCheckout}
          >
            {state === "loading" ? <Loader className="mr-2 border-red-200" /> : null}{" "}
            {common("yes")}
          </Button>
        </div>
      </Modal>
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
