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

  const assignedUnit = (call: FullTaxiCall) =>
    call.assignedUnit ? (
      <span>
        {call.assignedUnit.name} {call.assignedUnit.surname}
      </span>
    ) : (
      <span>{common("none")}</span>
    );

  React.useEffect(() => {
    setCalls(props.calls);
  }, [props.calls]);

  return (
    <Layout className="dark:text-white">
      <Head>
        <title>{t("taxi")} - SnailyCAD</title>
      </Head>

      <header className="flex items-center justify-between mb-5">
        <h1 className="text-3xl font-semibold">{t("tow")}</h1>

        <Button onClick={onCreateClick}>{t("createTaxiCall")}</Button>
      </header>

      {calls.length <= 0 ? (
        <p className="mt-5">{t("noTaxiCalls")}</p>
      ) : (
        <div className="overflow-x-auto w-full mt-3">
          <table className="overflow-hidden w-full whitespace-nowrap max-h-64">
            <thead>
              <tr>
                <th>{t("location")}</th>
                <th>{common("description")}</th>
                <th>{t("caller")}</th>
                <th>{t("assignedUnit")}</th>
                <th>{common("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((call) => (
                <tr key={call.id}>
                  <td>{call.location}</td>
                  <td>{call.description}</td>
                  <td className="capitalize">
                    {call.creator.name} {call.creator.surname}
                  </td>
                  <td className="capitalize">{assignedUnit(call)}</td>
                  <td className="w-36">
                    <Button onClick={() => editClick(call)} small variant="success">
                      {common("edit")}
                    </Button>
                    <Button className="ml-2" onClick={() => assignClick(call)} small>
                      {t("assignToCall")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
