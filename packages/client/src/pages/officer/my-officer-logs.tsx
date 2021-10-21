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
import { Select } from "components/form/Select";
import { FormField } from "components/form/FormField";

export type OfficerLogWithOfficer = OfficerLog & { officer: Officer };

interface Props {
  logs: OfficerLogWithOfficer[];
}

export default function MyOfficersLogs({ logs: data }: Props) {
  const [logs, setLogs] = React.useState(data);
  const t = useTranslations("Leo");

  const [officerId, setOfficerId] = React.useState<string | null>(null);

  const filtered = logs.filter((v) => (officerId ? v.officerId === officerId : true));
  const officers = logs.reduce(
    (ac, cv) => ({
      ...ac,
      [cv.officerId]: cv.officer.name,
    }),
    {},
  );

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

        <div className="flex">
          <div className="w-40 ml-3">
            <FormField label="Group By Officer">
              <Select
                isClearable
                onChange={(e) => setOfficerId(e.target.value)}
                value={officerId}
                values={Object.entries(officers).map(([id, name]) => ({
                  label: name as string,
                  value: id,
                }))}
              />
            </FormField>
          </div>
        </div>
      </header>

      {logs.length <= 0 ? (
        <p className="mt-5">{t("noOfficers")}</p>
      ) : (
        <div className="overflow-x-auto w-full mt-5">
          <table className="overflow-hidden w-full whitespace-nowrap max-h-64">
            <thead>
              <tr>
                <th>{t("officer")}</th>
                <th>{t("startedAt")}</th>
                <th>{t("endedAt")}</th>
                <th>{t("totalTime")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => {
                const startedAt = format(new Date(log.startedAt), "yyyy-MM-dd HH:mm:ss");
                const endedAt = log.endedAt && format(new Date(log.endedAt), "yyyy-MM-dd HH:mm:ss");

                return (
                  <tr key={log.id}>
                    <td>{log.officer.name}</td>
                    <td>{startedAt}</td>
                    <td>{log.endedAt !== null ? endedAt : t("notEndedYet")}</td>
                    <td>
                      {log.endedAt !== null
                        ? `${formatDistance(new Date(log.endedAt), new Date(log.startedAt))}`
                        : t("notEndedYet")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
