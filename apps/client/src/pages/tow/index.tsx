import * as React from "react";
import { useTranslations } from "use-intl";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import type { TaxiCall, TowCall } from "@snailycad/types";
import { Button } from "@snailycad/ui";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { TowTaxiCallsTable } from "components/calls/TowTaxiCallsTable";
import { Permissions } from "@snailycad/permissions";
import type { GetTowCallsData } from "@snailycad/types/api";

interface Props {
  calls: GetTowCallsData;
}

export default function Tow(props: Props) {
  const { openModal } = useModal();
  const [calls, setCalls] = React.useState(props.calls);
  const t = useTranslations("Calls");

  useListener(SocketEvents.CreateTowCall, (data: TowCall) => {
    const isAlreadyInCalls = calls.some((v) => v.id === data.id);

    if (!isAlreadyInCalls) {
      setCalls((p) => [data, ...p]);
    }
  });

  useListener(SocketEvents.EndTowCall, handleCallEnd);

  useListener(SocketEvents.UpdateTowCall, (data: TowCall) => {
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

  function handleCallEnd(call: Pick<TowCall, keyof TaxiCall>) {
    setCalls((p) => p.filter((v) => v.id !== call.id));
  }

  React.useEffect(() => {
    setCalls(props.calls);
  }, [props.calls]);

  return (
    <Layout
      permissions={{
        fallback: (u) => u.isTow,
        permissions: [
          Permissions.ViewTowCalls,
          Permissions.ViewTowLogs,
          Permissions.ManageTowCalls,
        ],
      }}
      className="dark:text-white"
    >
      <header className="flex items-center justify-between mb-5">
        <Title className="!mb-0">{t("tow")}</Title>

        <Button onPress={onCreateClick}>{t("createTowCall")}</Button>
      </header>

      <TowTaxiCallsTable
        type="tow"
        noCallsText={t("noTowCalls")}
        calls={calls}
        setCalls={setCalls as any}
      />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const user = await getSessionUser(req);
  const [data] = await requestAll(req, [["/tow", []]]);

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
