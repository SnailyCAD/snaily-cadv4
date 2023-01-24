import { useTranslations } from "use-intl";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import type { Officer, OfficerLog } from "@snailycad/types";
import { Select } from "components/form/Select";
import { FormField } from "components/form/FormField";
import { makeUnitName, requestAll } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { Title } from "components/shared/Title";
import { OfficerLogsTable } from "components/leo/logs/OfficerLogsTable";
import { Permissions } from "@snailycad/permissions";
import type { GetMyOfficersLogsData } from "@snailycad/types/api";
import { useAsyncTable } from "components/shared/Table";
import { useUserOfficers } from "hooks/leo/use-get-user-officers";

export type OfficerLogWithOfficer = OfficerLog & { officer: Officer };

interface Props {
  logs: GetMyOfficersLogsData;
}

export default function MyOfficersLogs({ logs: data }: Props) {
  const asyncTable = useAsyncTable({
    fetchOptions: {
      pageSize: 25,
      onResponse: (json: GetMyOfficersLogsData) => ({
        data: json.logs,
        totalCount: json.totalCount,
      }),
      path: "/leo/logs",
    },
    totalCount: data.totalCount,
    initialData: data.logs,
  });

  const { userOfficers, isLoading } = useUserOfficers();

  const t = useTranslations("Leo");
  const { generateCallsign } = useGenerateCallsign();

  const officerNames = userOfficers.reduce(
    (ac, cv) => ({
      ...ac,
      [cv.id]: `${generateCallsign(cv)} ${makeUnitName(cv)}`,
    }),
    {} as Record<string, string>,
  );

  return (
    <Layout
      permissions={{ fallback: (u) => u.isLeo, permissions: [Permissions.Leo] }}
      className="dark:text-white"
    >
      <header className="flex items-center justify-between">
        <Title className="!mb-0">{t("myOfficerLogs")}</Title>

        <div className="flex">
          <div className="ml-3 w-52">
            <FormField label="Group By Officer">
              <Select
                isLoading={isLoading}
                isClearable
                onChange={(e) => {
                  asyncTable.setFilters((prev) => ({
                    ...prev,
                    officerId: e.target.value,
                  }));
                }}
                value={asyncTable.filters?.officerId ?? null}
                values={Object.entries(officerNames).map(([id, name]) => ({
                  label: name,
                  value: id,
                }))}
              />
            </FormField>
          </div>
        </div>
      </header>

      {data.totalCount <= 0 ? (
        <p className="mt-5">{t("noOfficers")}</p>
      ) : (
        <OfficerLogsTable unit={null} asyncTable={asyncTable} />
      )}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  const [logs] = await requestAll(req, [["/leo/logs", { logs: [], totalCount: 0 }]]);

  return {
    props: {
      session: user,
      logs,
      messages: {
        ...(await getTranslations(["leo", "common"], user?.locale ?? locale)),
      },
    },
  };
};
