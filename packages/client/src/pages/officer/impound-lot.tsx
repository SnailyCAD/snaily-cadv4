import * as React from "react";
import Head from "next/head";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import { GetServerSideProps } from "next";
import { ImpoundedVehicle } from "types/prisma";
import { useModal } from "context/ModalContext";
import { Modal } from "components/modal/Modal";
import useFetch from "lib/useFetch";
import { Loader } from "components/Loader";
import { ModalIds } from "types/ModalIds";

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
      <Head>
        <title>{t("impoundLot")} - SnailyCAD</title>
      </Head>

      <h1 className="text-3xl font-semibold mb-3">{t("impoundLot")}</h1>

      {vehicles.length <= 0 ? (
        <p className="mt-5">{t("noImpoundedVehicles")}</p>
      ) : (
        <div className="overflow-x-auto w-full mt-3">
          <table className="overflow-hidden w-full whitespace-nowrap max-h-64">
            <thead>
              <tr>
                <th>{t("plate")}</th>
                <th>{t("model")}</th>
                <th>{t("location")}</th>
                <th>{common("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((item) => (
                <tr key={item.id}>
                  <td>{item.vehicle.plate.toUpperCase()}</td>
                  <td>{item.vehicle.model.value.value}</td>
                  <td>{item.location.value}</td>
                  <td className="w-36">
                    <Button onClick={() => handleCheckoutClick(item)} className="ml-2" small>
                      {t("allowCheckout")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        title={t("allowCheckout")}
        onClose={() => closeModal(ModalIds.AlertCheckoutImpoundedVehicle)}
        isOpen={isOpen(ModalIds.AlertCheckoutImpoundedVehicle)}
      >
        <p className="my-3">{t("alert_allowCheckout")}</p>
        <div className="mt-2 flex gap-2 items-center justify-end">
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
            {state === "loading" ? <Loader className="border-red-200 mr-2" /> : null}{" "}
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
