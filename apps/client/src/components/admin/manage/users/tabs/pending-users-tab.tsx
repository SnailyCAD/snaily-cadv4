import * as React from "react";
import { useTranslations } from "use-intl";
import type { User } from "@snailycad/types";
import { Table, useTableState } from "components/shared/Table";
import useFetch from "lib/useFetch";
import { useAsyncTable } from "hooks/shared/table/use-async-table";
import { Button, TabsContent } from "@snailycad/ui";
import type { GetManageUsersData, PostManageUserAcceptDeclineData } from "@snailycad/types/api";
import { SearchArea } from "components/shared/search/search-area";
import { useRouter } from "next/router";

export function PendingUsersTab(props: GetManageUsersData) {
  const [search, setSearch] = React.useState("");
  const t = useTranslations("Management");
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const router = useRouter();

  const asyncTable = useAsyncTable<User>({
    search,
    initialData: props.users,
    totalCount: props.pendingCount,
    fetchOptions: {
      path: "/admin/manage/users?pendingOnly=true",
      onResponse: (json: GetManageUsersData) => ({ totalCount: json.totalCount, data: json.users }),
    },
  });
  const tableState = useTableState({ pagination: asyncTable.pagination });

  async function handleAcceptOrDecline(user: User, type: "accept" | "decline") {
    const { json } = await execute<PostManageUserAcceptDeclineData>({
      path: `/admin/manage/users/pending/${user.id}/${type}`,
      method: "POST",
    });

    if (json) {
      asyncTable.remove(user.id);
      router.replace({ pathname: router.pathname, query: router.query });
    }
  }

  return (
    <TabsContent aria-label={t("pendingUsers")} value="pendingUsers">
      <h3 className="my-4 text-xl font-semibold">{t("pendingUsers")}</h3>

      <SearchArea
        totalCount={props.pendingCount}
        asyncTable={asyncTable}
        search={{ search, setSearch }}
      />

      {asyncTable.items.length <= 0 ? (
        <p>There are no users pending access.</p>
      ) : (
        <Table
          tableState={tableState}
          data={asyncTable.items.map((user) => ({
            id: user.id,
            username: user.username,
            actions: (
              <>
                <Button
                  size="xs"
                  onPress={() => handleAcceptOrDecline(user, "accept")}
                  className="mr-2"
                  variant="success"
                  disabled={state === "loading"}
                >
                  {common("accept")}
                </Button>
                <Button
                  size="xs"
                  onPress={() => handleAcceptOrDecline(user, "decline")}
                  variant="danger"
                  disabled={state === "loading"}
                >
                  {common("decline")}
                </Button>
              </>
            ),
          }))}
          columns={[
            { header: "Username", accessorKey: "username" },
            { header: common("actions"), accessorKey: "actions" },
          ]}
        />
      )}
    </TabsContent>
  );
}
