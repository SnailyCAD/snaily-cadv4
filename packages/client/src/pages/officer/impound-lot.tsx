import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import type { ImpoundedVehicle } from "@snailycad/types";
import { useModal } from "context/ModalContext";
import { Modal } from "components/modal/Modal";
import useFetch from "lib/useFetch";
import { Loader } from "components/Loader";
import { ModalIds } from "types/ModalIds";
import { Table } from "components/shared/Table";
import { Title } from "components/shared/Title";

interface Props {
  vehicles: ImpoundedVehicle[];
}

export default function ImpoundLot({ vehicles: data }: Props) {
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { isOpen, closeModal, openModal } = useModal();
  const { state, execute } = useFetch();

  const [vehicles, setVehicles] = React.useState(data);
  const [tempVehicle, setTempVehicle] = React.useState<ImpoundedVehicle | null>(null);

  async function handleCheckout() {
    if (!tempVehicle) return;

    const { json } = await execute(`/leo/impounded-vehicles/${tempVehicle.id}`, {
      method: "DELETE",
    });

    if (typeof json === "boolean") {
      setVehicles((p) => p.filter((v) => v.id !== tempVehicle.id));
      setTempVehicle(null);
      closeModal(ModalIds.AlertCheckoutImpoundedVehicle);
    }
  }

  function handleCheckoutClick(item: ImpoundedVehicle) {
    setTempVehicle(item);
    openModal(ModalIds.AlertCheckoutImpoundedVehicle);
  }

  return (
    <Layout className="dark:text-white">
      <Title>{t("impoundLot")}</Title>

      <h1 className="mb-3 text-3xl font-semibold">{t("impoundLot")}</h1>

      {vehicles.length <= 0 ? (
        <p className="mt-5">{t("noImpoundedVehicles")}</p>
      ) : (
        <Table
          data={vehicles.map((item) => ({
            plate: item.vehicle.plate,
            model: item.vehicle.model.value.value,
            location: item.location.value,
            actions: (
              <Button onClick={() => handleCheckoutClick(item)} className="ml-2" small>
                {t("allowCheckout")}
              </Button>
            ),
          }))}
          columns={[
            { Header: t("plate"), accessor: "plate" },
            { Header: t("model"), accessor: "model" },
            { Header: t("location"), accessor: "location" },
            { Header: common("actions"), accessor: "actions" },
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
            onClick={() => closeModal(ModalIds.AlertCheckoutImpoundedVehicle)}
          >
            {common("cancel")}
          </Button>
          <Button
            disabled={state === "loading"}
            className="flex items-center"
            onClick={handleCheckout}
          >
            {state === "loading" ? <Loader className="mr-2 border-red-200" /> : null}{" "}
            {common("continue")}
          </Button>
        </div>
      </Modal>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const [vehicles] = await requestAll(req, [["/leo/impounded-vehicles", []]]);

  return {
    props: {
      session: await getSessionUser(req),
      vehicles,
      messages: {
        ...(await getTranslations(["leo", "common"], locale)),
      },
    },
  };
};
