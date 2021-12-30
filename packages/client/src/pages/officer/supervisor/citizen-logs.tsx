import * as React from "react";
import Head from "next/head";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { makeUnitName, requestAll } from "lib/utils";
import { GetServerSideProps } from "next";
import { Citizen, RecordLog } from "types/prisma";
import { Table } from "components/table/Table";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/Input";
import format from "date-fns/format";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";

type Log = RecordLog & { citizen: Citizen };
interface Props {
  logs: Log[];
}

export default function CitizenLogs({ logs }: Props) {
  const [search, setSearch] = React.useState("");
  const [currentLog, setCurrentLog] = React.useState<Log | null>(null);

  const generateCallsign = useGenerateCallsign();
  const t = useTranslations("Leo");
  const common = useTranslations("Common");

  return (
    <Layout className="dark:text-white">
      <Head>
        <title>{t("citizenLogs")} - SnailyCAD</title>
      </Head>
      <h1 className="mb-3 text-3xl font-semibold">{t("citizenLogs")}</h1>
      {logs.length <= 0 ? (
        <p className="mt-5">{t("noImpoundedVehicles")}</p>
      ) : (
        <>
          <FormField label={common("search")} className="my-2">
            <Input onChange={(e) => setSearch(e.target.value)} value={search} />
          </FormField>

          {currentLog ? (
            <Table
              filter={search}
              data={logs
                .filter((v) => v.citizenId === currentLog.citizenId)
                .map((item) => {
                  const createdAt = item.warrant?.createdAt ?? item.records?.createdAt;
                  const formatted = format(new Date(createdAt!), "yyyy-MM-dd HH:mm:ss");
                  const officer = item.warrant?.officer ?? item.records?.officer;
                  const officerName = officer && makeUnitName(officer);
                  const callsign = officer && generateCallsign(officer);

                  return {
                    citizen: `${item.citizen.name} ${item.citizen.surname}`,
                    officer: `${callsign} ${officerName}`,
                    createdAt: formatted,
                    actions: (
                      <>
                        <Button onClick={() => setCurrentLog(item)}>{common("view")}</Button>
                      </>
                    ),
                  };
                })}
              columns={[
                { Header: t("citizen"), accessor: "citizen" },
                { Header: t("officer"), accessor: "officer" },
                { Header: common("createdAt"), accessor: "createdAt" },
                { Header: common("actions"), accessor: "actions" },
              ]}
            />
          ) : (
            <Table
              filter={search}
              data={logs.map((item) => {
                const createdAt = item.warrant?.createdAt ?? item.records?.createdAt;
                const formatted = format(new Date(createdAt!), "yyyy-MM-dd HH:mm:ss");
                const officer = item.warrant?.officer ?? item.records?.officer;
                const officerName = officer && makeUnitName(officer);
                const callsign = officer && generateCallsign(officer);

                return {
                  citizen: `${item.citizen.name} ${item.citizen.surname}`,
                  officer: `${callsign} ${officerName}`,
                  createdAt: formatted,
                  actions: (
                    <>
                      <Button onClick={() => setCurrentLog(item)}>{common("view")}</Button>
                    </>
                  ),
                };
              })}
              columns={[
                { Header: t("citizen"), accessor: "citizen" },
                { Header: t("officer"), accessor: "officer" },
                { Header: common("createdAt"), accessor: "createdAt" },
                { Header: common("actions"), accessor: "actions" },
              ]}
            />
          )}
        </>
      )}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const [logs] = await requestAll(req, [["/admin/manage/citizens/records-logs", []]]);

  return {
    props: {
      session: await getSessionUser(req),
      logs,
      messages: {
        ...(await getTranslations(["leo", "common"], locale)),
      },
    },
  };
};
