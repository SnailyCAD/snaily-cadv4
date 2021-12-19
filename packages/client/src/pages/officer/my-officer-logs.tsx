import * as React from "react";
import { useTranslations } from "use-intl";
import Head from "next/head";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { GetServerSideProps } from "next";
import { OfficerLog } from "types/prisma";
import formatDistance from "date-fns/formatDistance";
import format from "date-fns/format";
import { Select } from "components/form/Select";
import { FormField } from "components/form/FormField";
import { makeUnitName, requestAll } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { Table } from "components/table/Table";
import { useImageUrl } from "hooks/useImageUrl";
import { FullOfficer } from "state/dispatchState";

export type OfficerLogWithOfficer = OfficerLog & { officer: FullOfficer };

interface Props {
  logs: OfficerLogWithOfficer[];
}

export default function MyOfficersLogs({ logs: data }: Props) {
  const [logs, setLogs] = React.useState(data);
  const [officerId, setOfficerId] = React.useState<string | null>(null);
  const { makeImageUrl } = useImageUrl();

  const t = useTranslations("Leo");
  const generateCallsign = useGenerateCallsign();

  const filtered = logs.filter((v) => (officerId ? v.officerId === officerId : true));
  const officers = logs.reduce(
    (ac, cv) => ({
      ...ac,
      [cv.officerId]: `${generateCallsign(cv.officer)} ${makeUnitName(cv.officer)}`,
    }),
    {},
  );

  React.useEffect(() => {
    setLogs(data);
  }, [data]);

  return (
    <Layout className="dark:text-white">
      <Head>
        <title>{t("myOfficerLogs")} - SnailyCAD</title>
      </Head>

      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{t("myOfficerLogs")}</h1>

        <div className="flex">
          <div className="ml-3 w-52">
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
        <Table
          data={filtered.map((log) => {
            const startedAt = format(new Date(log.startedAt), "yyyy-MM-dd HH:mm:ss");

            const endedAt = log.endedAt
              ? format(new Date(log.endedAt), "yyyy-MM-dd HH:mm:ss")
              : t("notEndedYet");

            const totalTime =
              log.endedAt !== null
                ? `${formatDistance(new Date(log.endedAt), new Date(log.startedAt))}`
                : t("notEndedYet");

            return {
              officer: (
                <span className="flex items-center">
                  {log.officer.imageId ? (
                    <img
                      className="rounded-md w-[30px] h-[30px] object-cover mr-2"
                      draggable={false}
                      src={makeImageUrl("units", log.officer.imageId)}
                    />
                  ) : null}
                  {makeUnitName(log.officer)}
                </span>
              ),
              startedAt,
              endedAt,
              totalTime,
            };
          })}
          columns={[
            {
              Header: t("officer"),
              accessor: "officer",
            },
            {
              Header: t("startedAt"),
              accessor: "startedAt",
            },
            {
              Header: t("endedAt"),
              accessor: "endedAt",
            },
            {
              Header: t("totalTime"),
              accessor: "totalTime",
            },
          ]}
        />
      )}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const [logs] = await requestAll(req, [["/leo/logs", []]]);

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
