import * as React from "react";
import Head from "next/head";
import { useTranslations } from "use-intl";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { GetServerSideProps } from "next";
import { requestAll } from "lib/utils";
import { FullTowCall } from ".";
import { Table } from "components/table/Table";
import format from "date-fns/format";

interface Props {
  calls: FullTowCall[];
}

export default function TowLogs(props: Props) {
  const [calls, setCalls] = React.useState<FullTowCall[]>(props.calls);
  const common = useTranslations("Common");
  const t = useTranslations("Calls");

  useListener(SocketEvents.EndTowCall, handleCallEnd);

  function handleCallEnd(call: FullTowCall) {
    setCalls((p) => [call, ...p]);
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
    <Layout className="dark:text-white">
      <Head>
        <title>{t("towLogs")} - SnailyCAD</title>
      </Head>

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
            description: call.description,
            caller: call.creator ? `${call.creator.name} ${call.creator.surname}` : "Dispatch",
            assignedUnit: assignedUnit(call),
            createdAt: format(new Date(call.createdAt), "yyyy-MM-dd - hh:mm:ss"),
          }))}
          columns={[
            {
              Header: t("location"),
              accessor: "location",
            },
            {
              Header: t("postal"),
              accessor: "postal",
            },
            {
              Header: common("description"),
              accessor: "description",
            },
            {
              Header: t("caller"),
              accessor: "caller",
            },
            {
              Header: t("assignedUnit"),
              accessor: "assignedUnit",
            },
            {
              Header: common("createdAt"),
              accessor: "createdAt",
            },
          ]}
        />
      )}
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
