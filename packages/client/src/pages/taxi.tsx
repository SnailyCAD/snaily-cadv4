import * as React from "react";
import Head from "next/head";
import dynamic from "next/dynamic";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { GetServerSideProps } from "next";
import { Citizen, TaxiCall, TowCall } from "types/prisma";
import { Button } from "components/Button";
import { useTranslations } from "use-intl";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { requestAll } from "lib/utils";
import { Table } from "components/table/Table";
import format from "date-fns/format";

const AssignToCallModal = dynamic(
  async () => (await import("components/citizen/tow/AssignToTowCall")).AssignToCallModal,
);
const ManageCallModal = dynamic(
  async () => (await import("components/citizen/tow/ManageTowCall")).ManageCallModal,
);

export type FullTaxiCall = TaxiCall & { assignedUnit: Citizen | null; creator: Citizen };

interface Props {
  calls: FullTaxiCall[];
}

export default function Taxi(props: Props) {
  const { openModal } = useModal();
  const [calls, setCalls] = React.useState<FullTaxiCall[]>(props.calls);
  const common = useTranslations("Common");
  const t = useTranslations("Calls");

  const [tempCall, setTempCall] = React.useState<FullTaxiCall | null>(null);

  useListener(SocketEvents.CreateTaxiCall, (data: FullTaxiCall) => {
    setCalls((p) => [...p, data]);
  });

  useListener(SocketEvents.EndTaxiCall, handleCallEnd);

  useListener(SocketEvents.UpdateTaxiCall, (data: FullTaxiCall) => {
    const old = calls.find((v) => v.id === data.id);

    if (old) {
      setCalls((p) => {
        const removed = p.filter((v) => v.id !== data.id);

        return [data, ...removed];
      });
    }
  });

  function onCreateClick() {
    setTempCall(null);
    openModal(ModalIds.ManageTowCall);
  }

  function assignClick(call: FullTaxiCall) {
    openModal(ModalIds.AssignToTowCall);
    setTempCall(call);
  }

  function editClick(call: FullTaxiCall) {
    openModal(ModalIds.ManageTowCall);
    setTempCall(call);
  }

  function handleCallEnd(call: TowCall) {
    setCalls((p) => p.filter((v) => v.id !== call.id));
  }

  function updateCalls(old: TowCall, newC: TowCall) {
    setTempCall(null);
    setCalls((p) => {
      const idx = p.findIndex((v) => v.id === old.id);
      p[idx] = newC as FullTaxiCall;
      return p;
    });
  }

  function assignedUnit(call: FullTaxiCall) {
    return call.assignedUnit ? (
      <span>
        {call.assignedUnit.name} {call.assignedUnit.surname}
      </span>
    ) : (
      <span>{common("none")}</span>
    );
  }

  React.useEffect(() => {
    setCalls(props.calls);
  }, [props.calls]);

  return (
    <Layout className="dark:text-white">
      <Head>
        <title>{t("taxi")} - SnailyCAD</title>
      </Head>

      <header className="flex items-center justify-between mb-5">
        <h1 className="text-3xl font-semibold">{t("taxi")}</h1>

        <Button onClick={onCreateClick}>{t("createTaxiCall")}</Button>
      </header>

      {calls.length <= 0 ? (
        <p className="mt-5">{t("noTaxiCalls")}</p>
      ) : (
        <Table
          data={calls.map((call) => ({
            location: call.location,
            postal: call.postal || common("none"),
            description: call.description,
            caller: `${call.creator.name} ${call.creator.surname}`,
            assignedUnit: assignedUnit(call),
            createdAt: format(new Date(call.createdAt), "yyyy-MM-dd - hh:mm:ss"),
            actions: (
              <>
                <Button onClick={() => editClick(call)} small variant="success">
                  {common("edit")}
                </Button>
                <Button className="ml-2" onClick={() => assignClick(call)} small>
                  {t("assignToCall")}
                </Button>
              </>
            ),
          }))}
          columns={[
            { Header: t("location"), accessor: "location" },
            { Header: t("postal"), accessor: "postal" },
            { Header: common("description"), accessor: "description" },
            { Header: t("caller"), accessor: "caller" },
            { Header: t("assignedUnit"), accessor: "assignedUnit" },
            { Header: common("createdAt"), accessor: "createdAt" },
            { Header: common("actions"), accessor: "actions" },
          ]}
        />
      )}

      <AssignToCallModal onSuccess={updateCalls} call={tempCall} />
      <ManageCallModal onDelete={handleCallEnd} onUpdate={updateCalls} call={tempCall} />
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
        ...(await getTranslations(["calls", "common"], locale)),
      },
    },
  };
};
