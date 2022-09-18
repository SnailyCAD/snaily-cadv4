import * as React from "react";
import { useTranslations } from "use-intl";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { requestAll } from "lib/utils";
import { Table, useTableState } from "components/shared/Table";
import { Title } from "components/shared/Title";
import { FullDate } from "components/shared/FullDate";
import type { TowCall } from "@snailycad/types";
import { Permissions } from "@snailycad/permissions";
import type { GetTowCallsData } from "@snailycad/types/api";
import { CallDescription } from "components/dispatch/active-calls/CallDescription";

interface Props {
  calls: GetTowCallsData;
}

export default function TowLogs(props: Props) {
  const [calls, setCalls] = React.useState<TowCall[]>(props.calls);
  const common = useTranslations("Common");
  const t = useTranslations("Calls");
  const tableState = useTableState();

  useListener(SocketEvents.EndTowCall, handleCallEnd);

  function handleCallEnd(call: TowCall) {
    setCalls((p) => [call, ...p]);
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
    <Layout
      permissions={{ fallback: (u) => u.isTow, permissions: [Permissions.ViewTowLogs] }}
      className="dark:text-white"
    >
      <Title>{t("towLogs")}</Title>

      {calls.length <= 0 ? (
        <p className="mt-5">{t("noTowCalls")}</p>
      ) : (
        <Table
          tableState={tableState}
          data={calls.map((call) => ({
            id: call.id,
            location: call.location,
            postal: call.postal || common("none"),
            description: <CallDescription nonCard data={call} />,
            caller: call.creator ? `${call.creator.name} ${call.creator.surname}` : "Dispatch",
            assignedUnit: assignedUnit(call),
            createdAt: <FullDate>{call.createdAt}</FullDate>,
          }))}
          columns={[
            { header: t("location"), accessorKey: "location" },
            { header: t("postal"), accessorKey: "postal" },
            { header: common("description"), accessorKey: "description" },
            { header: t("caller"), accessorKey: "caller" },
            { header: t("assignedUnit"), accessorKey: "assignedUnit" },
            { header: common("createdAt"), accessorKey: "createdAt" },
          ]}
        />
      )}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ locale, req }) => {
  const user = await getSessionUser(req);
  const [data] = await requestAll(req, [["/tow?ended=true", []]]);

  return {
    props: {
      calls: data,
      session: user,
      messages: {
        ...(await getTranslations(["calls", "common"], user?.locale ?? locale)),
      },
    },
  };
};
