import * as React from "react";
import { useTranslations } from "use-intl";
import Link from "next/link";
import { Rank, User } from "@snailycad/types";
import { yesOrNoText } from "lib/utils";
import { TabsContent } from "components/shared/TabList";
import { buttonVariants } from "components/Button";
import { Table } from "components/shared/Table";
import { Status } from "components/shared/Status";
import { useAuth } from "context/AuthContext";
import { usePermission, Permissions } from "hooks/usePermission";
import { defaultPermissions } from "@snailycad/permissions";
import { classNames } from "lib/classNames";
import { useAsyncTable } from "hooks/shared/table/useAsyncTable";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { Loader } from "components/Loader";

interface Props {
  users: User[];
  totalCount: number;
}

export function AllUsersTab({ users, totalCount }: Props) {
  const { cad } = useAuth();
  const { hasPermissions } = usePermission();

  const t = useTranslations("Management");
  const common = useTranslations("Common");

  const asyncTable = useAsyncTable({
    initialData: users,
    totalCount,
    fetchOptions: {
      path: "/admin/manage/users",
      onResponse: (json) => ({ totalCount: json.totalCount, data: json.users }),
    },
  });

  return (
    <TabsContent aria-label={t("allUsers")} value="allUsers" className="mt-5">
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

      {asyncTable.search.search && asyncTable.pagination.totalCount !== totalCount ? (
        <p className="italic text-base font-semibold">
          Showing {asyncTable.pagination.totalCount} result(s)
        </p>
      ) : null}

      <Table
        pagination={{
          enabled: true,
          totalCount: asyncTable.pagination.totalCount,
          fetchData: asyncTable.pagination,
        }}
        data={asyncTable.data.map((user) => {
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
            username: user.username,
            rank: user.rank,
            isAdmin: common(yesOrNoText(hasAdminPermissions)),
            isLeo: common(yesOrNoText(hasLeoPermissions)),
            isEmsFd: common(yesOrNoText(hasEmsFdPermissions)),
            isDispatch: common(yesOrNoText(hasDispatchPermissions)),
            whitelistStatus: (
              <Status state={user.whitelistStatus}>{user.whitelistStatus.toLowerCase()}</Status>
            ),
            actions: (
              <Link href={`/admin/manage/users/${user.id}`}>
                <a
                  className={classNames(buttonVariants.default, "p-0.5 px-2 rounded-md")}
                  href={`/admin/manage/users/${user.id}`}
                >
                  {common("manage")}
                </a>
              </Link>
            ),
          };
        })}
        columns={[
          { Header: "Username", accessor: "username" },
          { Header: "Rank", accessor: "rank" },
          { Header: "Admin Permissions", accessor: "isAdmin" },
          { Header: "LEO Permissions", accessor: "isLeo" },
          { Header: "EMS/FD Permissions", accessor: "isEmsFd" },
          { Header: "Dispatch Permissions", accessor: "isDispatch" },
          cad?.whitelisted ? { Header: "Whitelist Status", accessor: "whitelistStatus" } : null,
          hasPermissions(
            [Permissions.ManageUsers, Permissions.BanUsers, Permissions.DeleteUsers],
            true,
          )
            ? { Header: common("actions"), accessor: "actions" }
            : null,
        ]}
      />
    </TabsContent>
  );
}
