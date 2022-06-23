import * as React from "react";
import { useTranslations } from "use-intl";
import type { User } from "@snailycad/types";
import { TabsContent } from "components/shared/TabList";
import { Button } from "components/Button";
import { Table } from "components/shared/Table";
import useFetch from "lib/useFetch";
import { useAsyncTable } from "hooks/shared/table/useAsyncTable";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { Loader } from "components/Loader";
import { useRouter } from "next/router";

interface Props {
  pendingCount: number;
  users: User[];
}

export function PendingUsersTab({ users, pendingCount }: Props) {
  const t = useTranslations("Management");
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const router = useRouter();

  const asyncTable = useAsyncTable<User>({
    initialData: !users.length ? [{} as any] : users,
    totalCount: pendingCount,
    fetchOptions: {
      path: "/admin/manage/users?pendingOnly=true",
      onResponse: (json) => ({ totalCount: json.totalCount, data: json.users }),
    },
  });

  async function handleAcceptOrDecline(user: Pick<User, "id">, type: "accept" | "decline") {
    const { json } = await execute(`/admin/manage/users/pending/${user.id}/${type}`, {
      method: "POST",
    });

    if (json) {
      const filtered = asyncTable.data.filter((v) => v.id !== user.id);
      asyncTable.setData(filtered);

      if (filtered.length <= 0) {
        await asyncTable.pagination.fetch({ pageSize: 35, pageIndex: 0 });
      }

      router.replace({ pathname: router.pathname, query: router.query });
    }
  }

  return (
    <TabsContent aria-label={t("pendingUsers")} value="pendingUsers">
      <h3 className="my-4 text-xl font-semibold">{t("pendingUsers")}</h3>

      <FormField label={common("search")} className="my-2 relative">
        <Input
          placeholder="john doe"
          onChange={(e) => asyncTable.search.setSearch(e.target.value)}
          value={asyncTable.search.search}
        />
        {asyncTable.state === "loading" ? (
          <span className="absolute top-[2.4rem] right-2.5">
            <Loader />
          </span>
        ) : null}
      </FormField>

      {asyncTable.search.search && asyncTable.pagination.totalCount !== pendingCount ? (
        <p className="italic text-base font-semibold">
          Showing {asyncTable.pagination.totalCount} result(s)
        </p>
      ) : null}

      {asyncTable.data.length <= 0 ? (
        <p>There are no users pending access.</p>
      ) : (
        <Table
          pagination={{
            enabled: true,
            totalCount: asyncTable.pagination.totalCount,
            fetchData: asyncTable.pagination,
          }}
          data={asyncTable.data.map((user) => ({
            username: user.username,
            actions: (
              <>
                <Button
                  size="xs"
                  onClick={() => handleAcceptOrDecline(user, "accept")}
                  className="mr-2"
                  variant="success"
                  disabled={state === "loading"}
                >
                  {common("accept")}
                </Button>
                <Button
                  size="xs"
                  onClick={() => handleAcceptOrDecline(user, "decline")}
                  variant="danger"
                  disabled={state === "loading"}
                >
                  {common("decline")}
                </Button>
              </>
            ),
          }))}
          columns={[
            { Header: "Username", accessor: "username" },
            { Header: common("actions"), accessor: "actions" },
          ]}
        />
      )}
    </TabsContent>
  );
}
