import * as React from "react";
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
import type { GetMyOfficersData, GetMyOfficersLogsData } from "@snailycad/types/api";
import useFetch from "lib/useFetch";
import { useAsyncTable } from "components/shared/Table";

export type OfficerLogWithOfficer = OfficerLog & { officer: Officer };

interface Props {
  logs: GetMyOfficersLogsData;
}

function useGetUserOfficers() {
  const [officers, setOfficers] = React.useState<Officer[]>([]);
  const { execute } = useFetch();

  const getOfficers = React.useCallback(async () => {
    const { json } = await execute<GetMyOfficersData>({ path: "/leo", method: "GET" });

    if (Array.isArray(json.officers)) {
      setOfficers(json.officers);
    }
  }, []); // eslint-disable-line

  React.useEffect(() => {
    getOfficers();
  }, [getOfficers]);

  return officers;
}

export default function MyOfficersLogs({ logs: data }: Props) {
  const asyncTable = useAsyncTable({
    fetchOptions: {
      onResponse: (json: GetMyOfficersLogsData) => ({
        data: json.logs,
        totalCount: json.totalCount,
      }),
      path: "/leo/logs",
    },
    totalCount: data.totalCount,
    initialData: data.logs,
  });

  const officers = useGetUserOfficers();

  const t = useTranslations("Leo");
  const { generateCallsign } = useGenerateCallsign();

  const officerNames = officers.reduce(
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
                isClearable
                onChange={(e) => {
                  asyncTable.list.sort({
                    ...asyncTable.list.sortDescriptor,
                    officerId: e.target.value,
                  });
                }}
                value={asyncTable.list.sortDescriptor?.officerId}
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
