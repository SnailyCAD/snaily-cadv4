import * as React from "react";
import { useTranslations } from "use-intl";
import Head from "next/head";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { handleRequest } from "lib/fetch";
import { getTranslations } from "lib/getTranslation";
import { GetServerSideProps } from "next";
import { Officer, OfficerLog } from "types/prisma";
import formatDistance from "date-fns/formatDistance";
import format from "date-fns/format";

export type OfficerLogWithOfficer = OfficerLog & { officer: Officer };
type Filter = null | "startedAt" | "endedAt";

interface Props {
  logs: OfficerLogWithOfficer[];
}

export default function MyOfficersLogs({ logs: data }: Props) {
  const [logs, setLogs] = React.useState(data);
  const t = useTranslations("Leo");

  const [filter] = React.useState<Filter>(null);

  React.useEffect(() => {
    setLogs(filterLogs(filter, logs));
  }, [filter, logs]);

  React.useEffect(() => {
    setLogs(data);
  }, [data]);

  return (
    <Layout>
      <Head>
        <title>{t("myOfficerLogs")} - SnailyCAD</title>
      </Head>

      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{t("myOfficerLogs")}</h1>

        {/* <div className="w-52">
          <Select
            onChange={(e) => setFilter(e.target.value)}
            value={filter}
            values={[
              { value: "endedAt", label: "Ended at" },
              { value: "startedAt", label: "Started at" },
              { value: "Group", label: "Group" },
            ]}
          />
        </div> */}
      </header>

      {logs.length <= 0 ? (
        <p className="mt-5">{t("noOfficers")}</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {logs.map((log) => {
            const startedAt = format(new Date(log.startedAt), "yyyy-MM-dd HH:mm:ss");
            const endedAt = log.endedAt && format(new Date(log.endedAt), "yyyy-MM-dd HH:mm:ss");

            return (
              <li key={log.id} className="bg-gray-200 p-4 rounded-md">
                <p id="officer_name">
                  <span className="font-semibold">{t("officer")}: </span>
                  {log.officer.name}
                </p>

                <p id="started_at">
                  <span className="font-semibold">{t("startedAt")}: </span>
                  {startedAt}
                </p>

                <p id="ended_at">
                  <span className="font-semibold">{t("endedAt")}: </span>
                  {log.endedAt !== null ? endedAt : t("notEndedYet")}
                </p>

                <p id="total">
                  <span className="font-semibold">{t("totalTime")}: </span>
                  {log.endedAt !== null
                    ? `${formatDistance(new Date(log.endedAt), new Date(log.startedAt))}`
                    : t("notEndedYet")}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const { data: logs } = await handleRequest("/leo/logs", {
    headers: req.headers,
  }).catch(() => ({ data: [] }));

  return {
    props: {
      session: await getSessionUser(req.headers),
      logs,
      messages: {
        ...(await getTranslations(["leo", "common"], locale)),
      },
    },
  };
};

function filterLogs(filter: Filter, logs: OfficerLogWithOfficer[]) {
  console.log({ filter });

  switch (filter) {
    case "startedAt": {
      return logs.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    }
    case "endedAt": {
      return logs.sort((a, b) => new Date(a.endedAt!).getTime() - new Date(b.endedAt!).getTime());
    }
    default: {
      return logs;
    }
  }
}
