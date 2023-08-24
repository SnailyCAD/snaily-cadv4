import { useTranslations } from "use-intl";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { makeUnitName, requestAll } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { Title } from "components/shared/Title";
import { OfficerLogsTable } from "components/leo/logs/OfficerLogsTable";
import { Permissions } from "@snailycad/permissions";
import type { EmsFdDeputy, OfficerLog } from "@snailycad/types";
import type { GetMyDeputiesLogsData } from "@snailycad/types/api";
import { useAsyncTable } from "components/shared/Table";
import { useGetUserDeputies } from "hooks/ems-fd/use-get-user-deputies";
import { SelectField } from "@snailycad/ui";

export interface OfficerLogWithDeputy extends Omit<OfficerLog, "emsFdDeputy" | "officer"> {
  emsFdDeputy: EmsFdDeputy;
}

interface Props {
  logs: GetMyDeputiesLogsData;
}

export default function MyDeputyLogs({ logs: data }: Props) {
  const { userDeputies, isLoading } = useGetUserDeputies();

  const asyncTable = useAsyncTable({
    fetchOptions: {
      pageSize: 25,
      onResponse: (json: GetMyDeputiesLogsData) => ({
        data: json.logs,
        totalCount: json.totalCount,
      }),
      path: "/ems-fd/logs?currentUserOnly",
    },
    totalCount: data.totalCount,
    initialData: data.logs,
  });

  const t = useTranslations();
  const { generateCallsign } = useGenerateCallsign();

  const deputyNames = userDeputies.reduce(
    (ac, cv) => ({
      ...ac,
      [cv.id]: `${generateCallsign(cv)} ${makeUnitName(cv)}`,
    }),
    {} as Record<string, string>,
  );

  return (
    <Layout permissions={{ permissions: [Permissions.EmsFd] }} className="dark:text-white">
      <header className="flex items-center justify-between">
        <Title className="!mb-0">{t("Ems.myDeputyLogs")}</Title>

        <div className="ml-3 w-64">
          <SelectField
            isDisabled={isLoading}
            isLoading={isLoading}
            onSelectionChange={(value) => {
              asyncTable.setFilters((prev) => ({
                ...prev,
                deputyId: value,
              }));
            }}
            selectedKey={asyncTable.filters?.deputyId ?? null}
            isClearable
            label={t("Leo.groupByDeputy")}
            options={Object.entries(deputyNames).map(([id, name]) => ({
              label: name,
              value: id,
            }))}
          />
        </div>
      </header>

      {data.totalCount <= 0 ? (
        <p className="my-2">{t("Ems.noDeputies")}</p>
      ) : (
        <OfficerLogsTable unit={null} asyncTable={asyncTable} />
      )}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  const [logs] = await requestAll(req, [["/ems-fd/logs", { logs: [], totalCount: 0 }]]);

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
