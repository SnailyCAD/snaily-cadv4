import * as React from "react";
import { useTranslations } from "use-intl";
import Link from "next/link";
import { yesOrNoText } from "lib/utils";
import { Table, useTableState } from "components/shared/Table";
import { useAuth } from "context/AuthContext";
import { usePermission, Permissions } from "hooks/usePermission";
import { defaultPermissions } from "@snailycad/permissions";
import { useAsyncTable } from "hooks/shared/table/use-async-table";
import { buttonVariants, Status, TabsContent } from "@snailycad/ui";
import type { GetManageUsersData } from "@snailycad/types/api";
import { SearchArea } from "components/shared/search/search-area";
import dynamic from "next/dynamic";

const PruneUsersModal = dynamic(
  async () => (await import("../modals/prune-users-modal")).PruneUsersModal,
  { ssr: false },
);

export function AllUsersTab({ users, totalCount }: GetManageUsersData) {
  const [search, setSearch] = React.useState("");

  const { cad } = useAuth();
  const { hasPermissions } = usePermission();

  const t = useTranslations("Management");
  const common = useTranslations("Common");

  const hasManagePermissions = hasPermissions([
    Permissions.ManageUsers,
    Permissions.BanUsers,
    Permissions.DeleteUsers,
  ]);

  const asyncTable = useAsyncTable({
    search,
    initialData: users,
    totalCount,
    sortingSchema: {
      username: "username",
      rank: "rank",
      whitelistStatus: "whitelistStatus",
    },
    fetchOptions: {
      path: "/admin/manage/users",
      onResponse: (json: GetManageUsersData) => ({ totalCount: json.totalCount, data: json.users }),
    },
  });
  const tableState = useTableState({
    sorting: asyncTable.sorting,
    pagination: asyncTable.pagination,
  });

  return (
    <TabsContent aria-label={t("allUsers")} value="allUsers" className="mt-5">
      <SearchArea totalCount={totalCount} asyncTable={asyncTable} search={{ search, setSearch }} />

      <Table
        isLoading={asyncTable.isInitialLoading}
        tableState={tableState}
        data={asyncTable.items.map((user) => {
          const hasAdminPermissions = hasPermissions(
            defaultPermissions.allDefaultAdminPermissions,
            user,
          );

          const hasLeoPermissions = hasPermissions(defaultPermissions.defaultLeoPermissions, user);

          const hasDispatchPermissions = hasPermissions(
            defaultPermissions.defaultDispatchPermissions,
            user,
          );

          const hasEmsFdPermissions = hasPermissions(
            defaultPermissions.defaultEmsFdPermissions,
            user,
          );

          return {
            id: user.id,
            username: user.username,
            rank: user.rank,
            isAdmin: common(yesOrNoText(hasAdminPermissions)),
            isLeo: common(yesOrNoText(hasLeoPermissions)),
            isEmsFd: common(yesOrNoText(hasEmsFdPermissions)),
            isDispatch: common(yesOrNoText(hasDispatchPermissions)),
            whitelistStatus: <Status>{user.whitelistStatus}</Status>,
            actions: (
              <Link
                className={buttonVariants({ size: "xs" })}
                href={`/admin/manage/users/${user.id}`}
              >
                {common("manage")}
              </Link>
            ),
          };
        })}
        columns={[
          { header: t("username"), accessorKey: "username" },
          { header: t("rank"), accessorKey: "rank" },
          { header: t("adminPermissions"), accessorKey: "isAdmin" },
          { header: t("leoPermissions"), accessorKey: "isLeo" },
          { header: t("emsFdPermissions"), accessorKey: "isEmsFd" },
          { header: t("dispatchPermissions"), accessorKey: "isDispatch" },
          cad?.whitelisted
            ? { header: t("whitelistStatus"), accessorKey: "whitelistStatus" }
            : null,

          hasManagePermissions ? { header: common("actions"), accessorKey: "actions" } : null,
        ]}
      />

      {hasManagePermissions ? <PruneUsersModal /> : null}
    </TabsContent>
  );
}
