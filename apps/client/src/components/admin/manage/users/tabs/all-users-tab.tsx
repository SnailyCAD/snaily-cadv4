import * as React from "react";
import { useTranslations } from "use-intl";
import Link from "next/link";
import { Rank } from "@snailycad/types";
import { yesOrNoText } from "lib/utils";
import { Table, useTableState } from "components/shared/Table";
import { Status } from "components/shared/Status";
import { useAuth } from "context/AuthContext";
import { usePermission, Permissions } from "hooks/usePermission";
import { defaultPermissions } from "@snailycad/permissions";
import { classNames } from "lib/classNames";
import { useAsyncTable } from "hooks/shared/table/use-async-table";
import { buttonVariants, TabsContent } from "@snailycad/ui";
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

  const hasManagePermissions = hasPermissions(
    [Permissions.ManageUsers, Permissions.BanUsers, Permissions.DeleteUsers],
    true,
  );

  const asyncTable = useAsyncTable({
    search,
    initialData: users,
    totalCount,
    fetchOptions: {
      path: "/admin/manage/users",
      onResponse: (json: GetManageUsersData) => ({ totalCount: json.totalCount, data: json.users }),
    },
  });
  const tableState = useTableState({ pagination: asyncTable.pagination });

  return (
    <TabsContent aria-label={t("allUsers")} value="allUsers" className="mt-5">
      <SearchArea totalCount={totalCount} asyncTable={asyncTable} search={{ search, setSearch }} />

      <Table
        tableState={tableState}
        data={asyncTable.items.map((user) => {
          const hasAdminPermissions = hasPermissions(
            defaultPermissions.allDefaultAdminPermissions,
            user.rank !== Rank.USER,
            user,
          );

          const hasLeoPermissions = hasPermissions(
            defaultPermissions.defaultLeoPermissions,
            user.isLeo,
            user,
          );

          const hasDispatchPermissions = hasPermissions(
            defaultPermissions.defaultDispatchPermissions,
            user.isLeo,
            user,
          );

          const hasEmsFdPermissions = hasPermissions(
            defaultPermissions.defaultEmsFdPermissions,
            user.isLeo,
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
                className={classNames(buttonVariants.default, "p-0.5 px-2 rounded-md")}
                href={`/admin/manage/users/${user.id}`}
              >
                {common("manage")}
              </Link>
            ),
          };
        })}
        columns={[
          { header: "Username", accessorKey: "username" },
          { header: "Rank", accessorKey: "rank" },
          { header: "Admin Permissions", accessorKey: "isAdmin" },
          { header: "LEO Permissions", accessorKey: "isLeo" },
          { header: "EMS/FD Permissions", accessorKey: "isEmsFd" },
          { header: "Dispatch Permissions", accessorKey: "isDispatch" },
          cad?.whitelisted ? { header: "Whitelist Status", accessorKey: "whitelistStatus" } : null,

          hasManagePermissions ? { header: common("actions"), accessorKey: "actions" } : null,
        ]}
      />

      {hasManagePermissions ? <PruneUsersModal /> : null}
    </TabsContent>
  );
}
