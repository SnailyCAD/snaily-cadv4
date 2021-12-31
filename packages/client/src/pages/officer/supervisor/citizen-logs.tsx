import * as React from "react";
import Head from "next/head";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { makeUnitName, requestAll } from "lib/utils";
import { GetServerSideProps } from "next";
import { Citizen, RecordLog, RecordType } from "types/prisma";
import { Table } from "components/table/Table";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/Input";
import format from "date-fns/format";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { ArrowLeft } from "react-bootstrap-icons";

type Log = RecordLog & { citizen: Citizen };
interface Props {
  logs: Log[];
}

const TYPE_LABELS = {
  [RecordType.TICKET]: "Ticket",
  [RecordType.ARREST_REPORT]: "Arrest Report",
  [RecordType.WRITTEN_WARNING]: "Written Warning",
};

export default function CitizenLogs({ logs: data }: Props) {
  const logs = React.useMemo(() => uniqueList(data), [data]);
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

      <header className="flex items-center justify-between">
        <h1 className="mb-3 text-3xl font-semibold">{t("citizenLogs")}</h1>

        <div>
          {currentLog ? (
            <Button className="flex items-center gap-2" onClick={() => setCurrentLog(null)}>
              <ArrowLeft />
              {"View all"}
            </Button>
          ) : null}
        </div>
      </header>

      {logs.length <= 0 ? (
        <p className="mt-5">{t("noLogs")}</p>
      ) : (
        <>
          <FormField label={common("search")} className="my-2">
            <Input onChange={(e) => setSearch(e.target.value)} value={search} />
          </FormField>

          {currentLog ? (
            <Table
              filter={search}
              defaultSort={{
                columnId: "createdAt",
                descending: true,
              }}
              data={data
                .filter((v) => v.citizenId === currentLog.citizenId)
                .map((item) => {
                  const type = item.records !== null ? TYPE_LABELS[item.records.type] : "Warrant";
                  const createdAt = item.warrant?.createdAt ?? item.records?.createdAt;
                  const formatted = format(new Date(createdAt!), "yyyy-MM-dd HH:mm:ss");
                  const officer = item.warrant?.officer ?? item.records?.officer;
                  const officerName = officer && makeUnitName(officer);
                  const callsign = officer && generateCallsign(officer);

                  const extra = item.records
                    ? {
                        status: "—",
                        postal: item.records.postal || common("none"),
                        notes: item.records.notes || common("none"),
                        violations:
                          item.records.violations.map((v) => v.penalCode.title).join(", ") ||
                          common("none"),
                      }
                    : {
                        postal: "—",
                        status: item.warrant?.status,
                        violations: "—",
                        notes: "—",
                      };

                  return {
                    type,
                    citizen: `${item.citizen.name} ${item.citizen.surname}`,
                    officer: `${callsign} ${officerName}`,
                    ...extra,
                    createdAt: formatted,
                  };
                })}
              columns={[
                { Header: common("type"), accessor: "type" },
                { Header: t("citizen"), accessor: "citizen" },
                { Header: t("officer"), accessor: "officer" },
                { Header: t("postal"), accessor: "postal" },
                { Header: t("status"), accessor: "status" },
                { Header: t("notes"), accessor: "notes" },
                { Header: t("violations"), accessor: "violations" },
                { Header: common("createdAt"), accessor: "createdAt" },
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

function uniqueList(logs: Log[]) {
  const arr: Log[] = [];

  for (let i = 0; i < logs.length; i++) {
    const citizenId = logs[i]?.citizenId;

    if (arr.some((v) => v.citizenId === citizenId)) {
      continue;
    }

    arr.push(logs[i]!);
  }

  return arr;
}
