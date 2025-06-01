import * as React from "react";
import { useTranslations } from "use-intl";
import { useListener } from "@casperiv/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { requestAll } from "lib/utils";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import { Title } from "components/shared/Title";
import type { TowCall } from "@snailycad/types";
import { Permissions } from "@snailycad/permissions";
import type { GetTowCallsData } from "@snailycad/types/api";
import { CallDescription } from "components/dispatch/active-calls/CallDescription";
import { FullDate } from "@snailycad/ui";
import { SearchArea } from "components/shared/search/search-area";

interface Props {
  initialData: GetTowCallsData;
}

export default function TowLogs(props: Props) {
  const [search, setSearch] = React.useState("");

  const common = useTranslations("Common");
  const t = useTranslations("Calls");

  const asyncTable = useAsyncTable({
    totalCount: props.initialData.totalCount,
    initialData: props.initialData.calls,
    search,
    fetchOptions: {
      path: "/tow?ended=true",
      onResponse(json: GetTowCallsData) {
        return { data: json.calls, totalCount: json.totalCount };
      },
    },
  });
  const tableState = useTableState({ pagination: asyncTable.pagination });

  function assignedUnit(call: TowCall) {
    return call.assignedUnit ? (
      <span>
        {call.assignedUnit.name} {call.assignedUnit.surname}
      </span>
    ) : (
      <span>{common("none")}</span>
    );
  }

  useListener(SocketEvents.EndTowCall, handleCallEnd);
  function handleCallEnd(call: TowCall) {
    asyncTable.remove(call.id);
  }

  return (
    <Layout permissions={{ permissions: [Permissions.ViewTowLogs] }} className="dark:text-white">
      <header>
        <Title>{t("towLogs")}</Title>
        <p className="max-w-2xl mt-2 text-neutral-700 dark:text-gray-400">
          {t("towLogsDescription")}
        </p>
      </header>

      <SearchArea
        asyncTable={asyncTable}
        search={{ search, setSearch }}
        totalCount={props.initialData.totalCount}
      />

      {asyncTable.items.length <= 0 ? (
        <p className="text-neutral-700 dark:text-gray-400 mt-10">{t("noTowCalls")}</p>
      ) : (
        <Table
          tableState={tableState}
          data={asyncTable.items.map((call) => ({
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
  const [data] = await requestAll(req, [["/tow?ended=true", { totalCount: 0, calls: [] }]]);

  return {
    props: {
      initialData: data,
      session: user,
      messages: {
        ...(await getTranslations(["calls", "common"], user?.locale ?? locale)),
      },
    },
  };
};
