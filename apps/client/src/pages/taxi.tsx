import * as React from "react";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import type { TaxiCall } from "@snailycad/types";
import { Button } from "@snailycad/ui";
import { useTranslations } from "use-intl";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { TowTaxiCallsTable } from "components/calls/TowTaxiCallsTable";
import { Permissions } from "@snailycad/permissions";

interface Props {
  calls: TaxiCall[];
}

export default function Taxi(props: Props) {
  const { openModal } = useModal();
  const [calls, setCalls] = React.useState<TaxiCall[]>(props.calls);
  const t = useTranslations("Calls");

  useListener(SocketEvents.CreateTaxiCall, (data: TaxiCall) => {
    const isAlreadyInCalls = calls.some((v) => v.id === data.id);

    if (!isAlreadyInCalls) {
      setCalls((p) => [data, ...p]);
    }
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
    <Layout
      permissions={{
        fallback: (u) => u.isTaxi,
        permissions: [Permissions.ViewTaxiCalls, Permissions.ManageTaxiCalls],
      }}
      className="dark:text-white"
    >
      <header className="flex items-center justify-between mb-5">
        <Title>{t("taxi")}</Title>

        <Button onPress={onCreateClick}>{t("createTaxiCall")}</Button>
      </header>

      <TowTaxiCallsTable
        type="taxi"
        noCallsText={t("noTaxiCalls")}
        setCalls={setCalls}
        calls={calls}
      />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const user = await getSessionUser(req);
  const [data] = await requestAll(req, [["/taxi", []]]);

  return {
    props: {
      calls: data,
      session: user,
      messages: {
        ...(await getTranslations(["calls", "leo", "common"], user?.locale ?? locale)),
      },
    },
  };
};
