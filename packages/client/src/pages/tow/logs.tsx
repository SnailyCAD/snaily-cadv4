import * as React from "react";
import { useTranslations } from "use-intl";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { requestAll } from "lib/utils";
import { Table } from "components/shared/Table";
import { Title } from "components/shared/Title";
import { ModalIds } from "types/ModalIds";
import { useModal } from "context/ModalContext";
import { Button } from "components/Button";
import dynamic from "next/dynamic";
import { FullDate } from "components/shared/FullDate";
import type { TowCall } from "@snailycad/types";

const DescriptionModal = dynamic(
  async () => (await import("components/modal/DescriptionModal/DescriptionModal")).DescriptionModal,
);

interface Props {
  calls: TowCall[];
}

export default function TowLogs(props: Props) {
  const [tempCall, setTempCall] = React.useState<TowCall | null>(null);
  const [calls, setCalls] = React.useState<TowCall[]>(props.calls);
  const common = useTranslations("Common");
  const t = useTranslations("Calls");
  const { openModal } = useModal();

  useListener(SocketEvents.EndTowCall, handleCallEnd);

  function handleCallEnd(call: TowCall) {
    setCalls((p) => [call, ...p]);
  }

  function handleViewDescription(call: TowCall) {
    setTempCall(call);
    openModal(ModalIds.Description, call);
  }

  function assignedUnit(call: TowCall) {
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
      <Title>{t("towLogs")}</Title>

      <header className="flex items-center justify-between mb-5">
        <h1 className="text-3xl font-semibold">{t("towLogs")}</h1>
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
            createdAt: <FullDate>{call.createdAt}</FullDate>,
          }))}
          columns={[
            { Header: t("location"), accessor: "location" },
            { Header: t("postal"), accessor: "postal" },
            { Header: common("description"), accessor: "description" },
            { Header: t("caller"), accessor: "caller" },
            { Header: t("assignedUnit"), accessor: "assignedUnit" },
            { Header: common("createdAt"), accessor: "createdAt" },
          ]}
        />
      )}

      {tempCall?.descriptionData ? (
        <DescriptionModal onClose={() => setTempCall(null)} value={tempCall.descriptionData} />
      ) : null}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const [data] = await requestAll(req, [["/tow?ended=true", []]]);

  return {
    props: {
      calls: data,
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["calls", "common"], locale)),
      },
    },
  };
};
