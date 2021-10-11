import * as React from "react";
import Head from "next/head";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { GetServerSideProps } from "next";
import { Citizen, TowCall } from "types/prisma";
import { handleRequest } from "lib/fetch";
import { Button } from "components/Button";
import { useTranslations } from "use-intl";
import { useListener } from "context/SocketContext";
import { SocketEvents } from "@snailycad/config";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { AssignToCallModal } from "components/citizen/tow/AssignToTowCall";
import { ManageTowCallModal } from "components/citizen/tow/ManageTowCall";

export type FullTowCall = TowCall & { assignedUnit: Citizen | null; creator: Citizen };

interface Props {
  calls: FullTowCall[];
}

export default function Tow(props: Props) {
  const { openModal } = useModal();
  const [calls, setCalls] = React.useState<FullTowCall[]>(props.calls);
  const common = useTranslations("Common");
  const t = useTranslations("Tow");

  const [tempCall, setTempCall] = React.useState<FullTowCall | null>(null);

  useListener(SocketEvents.CreateTowCall, (data: FullTowCall) => {
    setCalls((p) => [...p, data]);
  });

  useListener(SocketEvents.UpdateTowCall, (data: FullTowCall) => {
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

  function assignClick(call: FullTowCall) {
    openModal(ModalIds.AssignToTowCall);
    setTempCall(call);
  }

  function editClick(call: FullTowCall) {
    openModal(ModalIds.ManageTowCall);
    setTempCall(call);
  }

  function updateCalls(old: TowCall, newC: TowCall) {
    setTempCall(null);
    setCalls((p) => {
      const idx = p.findIndex((v) => v.id === old.id);
      p[idx] = newC as FullTowCall;
      return p;
    });
  }

  const assignedUnit = (call: FullTowCall) =>
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
    <Layout>
      <Head>
        <title>{t("tow")} - SnailyCAD</title>
      </Head>

      <header className="flex items-center justify-between mb-5">
        <h1 className="text-3xl font-semibold">{t("tow")}</h1>

        <Button onClick={onCreateClick}>{t("createTowCall")}</Button>
      </header>

      {calls.length <= 0 ? (
        <p className="mt-5">{t("noTowCalls")}</p>
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
      <ManageTowCallModal onUpdate={updateCalls} call={tempCall} />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const { data: citizens } = await handleRequest<any[]>("/citizen", {
    headers: req.headers,
  }).catch(() => ({ data: [] }));

  const { data } = await handleRequest("/tow", {
    headers: req.headers,
  }).catch(() => ({ data: [] }));

  return {
    props: {
      calls: data,
      citizens,
      session: await getSessionUser(req.headers),
      messages: {
        ...(await getTranslations(["tow", "common"], locale)),
      },
    },
  };
};
