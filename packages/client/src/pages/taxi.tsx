import * as React from "react";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import type { TaxiCall } from "@snailycad/types";
import { Button } from "components/Button";
import { useTranslations } from "use-intl";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { TowTaxiCallsTable } from "components/calls/TowTaxiCallsTable";

interface Props {
  calls: TaxiCall[];
}

export default function Taxi(props: Props) {
  const { openModal } = useModal();
  const [calls, setCalls] = React.useState<TaxiCall[]>(props.calls);
  const t = useTranslations("Calls");

  useListener(SocketEvents.CreateTaxiCall, (data: TaxiCall) => {
    setCalls((p) => [...p, data]);
  });

  useListener(SocketEvents.EndTaxiCall, handleCallEnd);

  useListener(SocketEvents.UpdateTaxiCall, (data: TaxiCall) => {
    const old = calls.find((v) => v.id === data.id);

    if (old) {
      setCalls((p) => {
        const removed = p.filter((v) => v.id !== data.id);

        return [data, ...removed];
      });
    }
  });

  function onCreateClick() {
    openModal(ModalIds.ManageTowCall);
  }

  function handleCallEnd(call: TaxiCall) {
    setCalls((p) => p.filter((v) => v.id !== call.id));
  }

  React.useEffect(() => {
    setCalls(props.calls);
  }, [props.calls]);

  return (
    <Layout className="dark:text-white">
      <Title>{t("taxi")}</Title>

      <header className="flex items-center justify-between mb-5">
        <h1 className="text-3xl font-semibold">{t("taxi")}</h1>

        <Button onClick={onCreateClick}>{t("createTaxiCall")}</Button>
      </header>

      <TowTaxiCallsTable noCallsText={t("noTaxiCalls")} setCalls={setCalls} calls={calls} />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const [data, citizens] = await requestAll(req, [
    ["/taxi", []],
    ["/citizen", []],
  ]);

  return {
    props: {
      calls: data,
      citizens,
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["calls", "leo", "common"], locale)),
      },
    },
  };
};
