import * as React from "react";
import { useTranslations } from "use-intl";
import { useListener } from "@casper124578/use-socket.io";
import dynamic from "next/dynamic";
import { SocketEvents } from "@snailycad/config";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { GetServerSideProps } from "next";
import { Citizen, TowCall } from "types/prisma";
import { Button } from "components/Button";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { requestAll } from "lib/utils";
import format from "date-fns/format";
import { Table } from "components/shared/Table";
import { Title } from "components/shared/Title";

const AssignToCallModal = dynamic(
  async () => (await import("components/citizen/tow/AssignToTowCall")).AssignToCallModal,
);
const ManageCallModal = dynamic(
  async () => (await import("components/citizen/tow/ManageTowCall")).ManageCallModal,
);
const DescriptionModal = dynamic(
  async () => (await import("components/modal/DescriptionModal/DescriptionModal")).DescriptionModal,
);

export type FullTowCall = TowCall & { assignedUnit: Citizen | null; creator: Citizen };

interface Props {
  calls: FullTowCall[];
}

export default function Tow(props: Props) {
  const { openModal } = useModal();
  const [calls, setCalls] = React.useState<FullTowCall[]>(props.calls);
  const common = useTranslations("Common");
  const t = useTranslations("Calls");

  const [tempCall, setTempCall] = React.useState<FullTowCall | null>(null);

  useListener(SocketEvents.CreateTowCall, (data: FullTowCall) => {
    setCalls((p) => [...p, data]);
  });

  useListener(SocketEvents.EndTowCall, handleCallEnd);

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

  function handleViewDescription(call: FullTowCall) {
    setTempCall(call);
    openModal(ModalIds.Description, call);
  }

  function handleCallEnd(call: TowCall) {
    setCalls((p) => p.filter((v) => v.id !== call.id));
  }

  function updateCalls(old: TowCall, newC: TowCall) {
    setTempCall(null);
    setCalls((p) => {
      const idx = p.findIndex((v) => v.id === old.id);
      p[idx] = newC as FullTowCall;
      return p;
    });
  }

  function assignedUnit(call: FullTowCall) {
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
      <Title>{t("tow")}</Title>

      <header className="flex items-center justify-between mb-5">
        <h1 className="text-3xl font-semibold">{t("tow")}</h1>

        <Button onClick={onCreateClick}>{t("createTowCall")}</Button>
      </header>

      {calls.length <= 0 ? (
        <p className="mt-5">{t("noTowCalls")}</p>
      ) : (
        <Table
          data={calls.map((call) => ({
            location: call.location,
            postal: call.postal || common("none"),
            description:
              call.description && !call.descriptionData ? (
                call.description
              ) : (
                <Button small onClick={() => handleViewDescription(call)}>
                  {common("viewDescription")}
                </Button>
              ),
            caller: call.creator ? `${call.creator.name} ${call.creator.surname}` : "Dispatch",
            assignedUnit: assignedUnit(call),
            createdAt: format(new Date(call.createdAt), "yyyy-MM-dd - HH:mm:ss"),
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
      {tempCall?.descriptionData ? (
        <DescriptionModal isReadonly value={tempCall?.descriptionData} />
      ) : null}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const [data, citizens] = await requestAll(req, [
    ["/tow", []],
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
