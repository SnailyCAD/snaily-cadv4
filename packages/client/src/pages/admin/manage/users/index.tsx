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
import { Button } from "components/Button";
import { Input } from "components/form/inputs/Input";
import { FormField } from "components/form/FormField";
import { Table } from "components/shared/Table";
import { Title } from "components/shared/Title";
import { Status } from "components/shared/Status";
import { useAuth } from "context/AuthContext";
import { usePermission, Permissions } from "hooks/usePermission";
import { defaultPermissions } from "@snailycad/permissions";

interface Props {
  users: User[];
}

export default function ManageUsers({ users: data }: Props) {
  const [users, setUsers] = React.useState<User[]>(data);
  const [search, setSearch] = React.useState("");
  const { cad } = useAuth();
  const { hasPermissions } = usePermission();

  const t = useTranslations("Management");
  const common = useTranslations("Common");
  const pending = users.filter((v) => v.whitelistStatus === WhitelistStatus.PENDING);

  React.useEffect(() => {
    setUsers(data);
  }, [data]);

  const tabs = [
    { name: `${t("allUsers")} (${users.length})`, value: "allUsers" },
    { name: `${t("pendingUsers")} (${pending.length})`, value: "pendingUsers" },
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

      <FormField label={common("search")} className="my-2">
        <Input placeholder="john doe" onChange={(e) => setSearch(e.target.value)} value={search} />
      </FormField>

      <TabList tabs={tabs}>
        <TabsContent aria-label={t("allUsers")} value="allUsers" className="mt-5">
          <Table
            filter={search}
            data={users.map((user) => {
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
                    <a>
                      <Button small>{common("manage")}</Button>
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

        <PendingUsersTab setUsers={setUsers} users={pending} search={search} />
      </TabList>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const [users] = await requestAll(req, [["/admin/manage/users", []]]);

  return {
    props: {
      users,
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["citizen", "admin", "values", "common"], locale)),
      },
    },
  };
};
