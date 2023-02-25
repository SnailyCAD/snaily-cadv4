import * as React from "react";
import { useTranslations } from "use-intl";
import { buttonSizes, buttonVariants, TabsContent } from "@snailycad/ui";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import Link from "next/link";
import { classNames } from "lib/classNames";
import { SearchArea } from "components/shared/search/search-area";
import type { GetManageRecordLogsData } from "@snailycad/types/api";

interface Props {
  citizens: GetManageRecordLogsData;
}

export function CitizenLogsTab({ citizens }: Props) {
  const [search, setSearch] = React.useState("");

  const asyncTable = useAsyncTable({
    search,
    fetchOptions: {
      onResponse: (data: GetManageRecordLogsData) => ({
        data: data.citizens,
        totalCount: data.totalCount,
      }),
      path: "/admin/manage/records-logs",
    },
    totalCount: citizens.totalCount,
    initialData: citizens.citizens,
  });

  const tableState = useTableState({ pagination: asyncTable.pagination });
  const common = useTranslations("Common");
  const t = useTranslations("Leo");

  return (
    <TabsContent value="citizen-logs-tab">
      {asyncTable.items.length <= 0 ? (
        <p className="mt-5">{t("noCitizenLogs")}</p>
      ) : (
        <>
          <SearchArea totalCount={0} asyncTable={asyncTable} search={{ setSearch, search }} />

          <Table
            tableState={tableState}
            data={asyncTable.items.map((citizen) => {
              return {
                id: citizen.id,
                citizen: `${citizen.name} ${citizen.surname}`,
                actions: (
                  <Link
                    className={classNames("rounded-md", buttonSizes.xs, buttonVariants.default)}
                    href={`/officer/supervisor/citizen-logs/${citizen.id}`}
                  >
                    {common("view")}
                  </Link>
                ),
              };
            })}
            columns={[
              { header: t("citizen"), accessorKey: "citizen" },
              { header: common("actions"), accessorKey: "actions" },
            ]}
          />
        </>
      )}
    </TabsContent>
  );
}
