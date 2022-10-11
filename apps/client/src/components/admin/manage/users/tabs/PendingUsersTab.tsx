import * as React from "react";
import { useTranslations } from "use-intl";
import type { User } from "@snailycad/types";
import { TabsContent } from "components/shared/TabList";
import { Table, useTableState } from "components/shared/Table";
import useFetch from "lib/useFetch";
import { useAsyncTable } from "hooks/shared/table/useAsyncTable";
import { Loader, Button, TextField } from "@snailycad/ui";
import { useRouter } from "next/router";
import type { GetManageUsersData, PostManageUserAcceptDeclineData } from "@snailycad/types/api";

export function PendingUsersTab({ users, pendingCount }: GetManageUsersData) {
  const t = useTranslations("Management");
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const router = useRouter();

  const asyncTable = useAsyncTable<User>({
    initialData: !users.length ? [{} as any] : users,
    totalCount: pendingCount,
    fetchOptions: {
      path: "/admin/manage/users?pendingOnly=true",
      onResponse: (json: GetManageUsersData) => ({ totalCount: json.totalCount, data: json.users }),
    },
  });
  const tableState = useTableState({ pagination: asyncTable.pagination });

  async function handleAcceptOrDecline(user: Pick<User, "id">, type: "accept" | "decline") {
    const { json } = await execute<PostManageUserAcceptDeclineData>({
      path: `/admin/manage/users/pending/${user.id}/${type}`,
      method: "POST",
    });

    if (json) {
      const filtered = asyncTable.data.filter((v) => v.id !== user.id);
      asyncTable.setData(filtered);

      if (filtered.length <= 0) {
        await asyncTable.pagination.onPageChange({ pageSize: 35, pageIndex: 0 });
      }

      router.replace({ pathname: router.pathname, query: router.query });
    }
  }

  return (
    <TabsContent aria-label={t("pendingUsers")} value="pendingUsers">
      <h3 className="my-4 text-xl font-semibold">{t("pendingUsers")}</h3>

      <TextField
        label={common("search")}
        className="w-full relative"
        name="search"
        onChange={(value) => asyncTable.search.setSearch(value)}
        value={asyncTable.search.search}
        placeholder="Search..."
      >
        {asyncTable.search.state === "loading" ? (
          <span className="absolute top-[2.4rem] right-2.5">
            <Loader />
          </span>
        ) : null}
      </TextField>

      {asyncTable.search.search && asyncTable.pagination.totalDataCount !== pendingCount ? (
        <p className="italic text-base font-semibold">
          Showing {asyncTable.pagination.totalDataCount} result(s)
        </p>
      ) : null}

      {asyncTable.data.length <= 0 ? (
        <p>There are no users pending access.</p>
      ) : (
        <Table
          tableState={tableState}
          data={asyncTable.data.map((user) => ({
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
