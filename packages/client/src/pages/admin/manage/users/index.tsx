import * as React from "react";
import { useTranslations } from "use-intl";
import Link from "next/link";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { Rank, User, WhitelistStatus } from "@snailycad/types";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll, yesOrNoText } from "lib/utils";
import { TabList, TabsContent } from "components/shared/TabList";
import { PendingUsersTab } from "components/admin/manage/users/PendingUsersTab";
import { buttonVariants } from "components/Button";
import { Input } from "components/form/inputs/Input";
import { FormField } from "components/form/FormField";
import { Table } from "components/shared/Table";
import { Title } from "components/shared/Title";
import { Status } from "components/shared/Status";
import { useAuth } from "context/AuthContext";
import { usePermission, Permissions } from "hooks/usePermission";
import { defaultPermissions } from "@snailycad/permissions";
import { classNames } from "lib/classNames";
import { useAsyncTable } from "hooks/shared/table/useAsyncTable";
import { Loader } from "components/Loader";

interface Props {
  data: { users: User[]; pendingCount: number; totalCount: number };
}

export default function ManageUsers({ data }: Props) {
  const [users, setUsers] = React.useState<User[]>(data.users);
  const { cad } = useAuth();
  const { hasPermissions } = usePermission();

  const asyncTable = useAsyncTable({
    initialData: data.users,
    totalCount: data.totalCount,
    fetchOptions: {
      path: "/admin/manage/users",
      onResponse: (json) => ({ totalCount: json.totalCount, data: json.users }),
    },
  });

  const t = useTranslations("Management");
  const common = useTranslations("Common");
  const pending = users.filter((v) => v.whitelistStatus === WhitelistStatus.PENDING);

  React.useEffect(() => {
    setUsers(data.users);
  }, [data]);

  const tabs = [
    { name: `${t("allUsers")} (${data.totalCount})`, value: "allUsers" },
    { name: `${t("pendingUsers")} (${data.pendingCount})`, value: "pendingUsers" },
  ];

  return (
    <AdminLayout
      permissions={{
        fallback: (u) => u.rank !== Rank.USER,
        permissions: [
          Permissions.BanUsers,
          Permissions.ViewUsers,
          Permissions.ManageUsers,
          Permissions.DeleteUsers,
        ],
      }}
    >
      <Title>{t("MANAGE_USERS")}</Title>

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

      <TabList tabs={tabs}>
        <TabsContent aria-label={t("allUsers")} value="allUsers" className="mt-5">
          {asyncTable.search.search && asyncTable.pagination.totalCount !== data.totalCount ? (
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

        <PendingUsersTab
          pendingCount={data.pendingCount}
          setUsers={setUsers}
          users={pending}
          search={asyncTable.search.search}
        />
      </TabList>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const [usersData] = await requestAll(req, [["/admin/manage/users", []]]);

  return {
    props: {
      data: usersData,
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["citizen", "admin", "values", "common"], locale)),
      },
    },
  };
};
