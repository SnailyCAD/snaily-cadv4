import * as React from "react";
import { useTranslations } from "use-intl";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { Select } from "components/form/Select";
import { FormField } from "components/form/FormField";
import { makeUnitName, requestAll } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { Title } from "components/shared/Title";
import { OfficerLogsTable } from "components/leo/logs/OfficerLogsTable";
import { Permissions } from "@snailycad/permissions";
import type { EmsFdDeputy, OfficerLog } from "@snailycad/types";
import type { GetMyDeputiesLogsData } from "@snailycad/types/api";

export type OfficerLogWithDeputy = OfficerLog & { emsFdDeputy: EmsFdDeputy };

interface Props {
  logs: GetMyDeputiesLogsData;
}

export default function MyDeputyLogs({ logs: data }: Props) {
  const [logs, setLogs] = React.useState(data);
  const [deputyId, setDeputyId] = React.useState<string | null>(null);

  const t = useTranslations();
  const { generateCallsign } = useGenerateCallsign();

  const filtered = logs.filter((v) => (deputyId ? v.emsFdDeputyId === deputyId : true));
  const officers = logs.reduce(
    (ac, cv) => ({
      ...ac,
      ...(cv.emsFdDeputyId && cv.emsFdDeputy
        ? {
            [cv.emsFdDeputyId]: `${generateCallsign(cv.emsFdDeputy)} ${makeUnitName(
              cv.emsFdDeputy,
            )}`,
          }
        : {}),
    }),
    {},
  );

  React.useEffect(() => {
    setLogs(data);
  }, [data]);

  return (
    <Layout
      permissions={{ fallback: (u) => u.isLeo, permissions: [Permissions.Leo] }}
      className="dark:text-white"
    >
      <header className="flex items-center justify-between">
        <Title className="!mb-0">{t("Ems.myDeputyLogs")}</Title>

        <div className="flex">
          <div className="ml-3 w-52">
            <FormField label="Group By Deputy">
              <Select
                isClearable
                onChange={(e) => setDeputyId(e.target.value)}
                value={deputyId}
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
        <p className="mt-5">{t("Ems.noDeputies")}</p>
      ) : (
        <OfficerLogsTable unit={null} logs={filtered} />
      )}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  const [logs] = await requestAll(req, [["/ems-fd/logs", []]]);

  return {
    props: {
      session: user,
      logs,
      messages: {
        ...(await getTranslations(["ems-fd", "leo", "common"], user?.locale ?? locale)),
      },
    },
  };
};
