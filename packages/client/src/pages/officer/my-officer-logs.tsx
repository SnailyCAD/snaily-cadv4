import * as React from "react";
import { useTranslations } from "use-intl";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import type { OfficerLog } from "@snailycad/types";
import type { FullOfficer } from "state/dispatchState";
import { Select } from "components/form/Select";
import { FormField } from "components/form/FormField";
import { makeUnitName, requestAll } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { Title } from "components/shared/Title";
import { OfficerLogsTable } from "components/leo/logs/OfficerLogsTable";

export type OfficerLogWithOfficer = OfficerLog & { officer: FullOfficer };

interface Props {
  logs: OfficerLogWithOfficer[];
}

export default function MyOfficersLogs({ logs: data }: Props) {
  const [logs, setLogs] = React.useState(data);
  const [officerId, setOfficerId] = React.useState<string | null>(null);

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
      <Title>{t("myOfficerLogs")}</Title>

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
        <OfficerLogsTable logs={filtered} />
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
