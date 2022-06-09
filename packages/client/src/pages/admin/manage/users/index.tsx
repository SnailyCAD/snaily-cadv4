import * as React from "react";
import { useTranslations } from "use-intl";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { Rank, User, WhitelistStatus } from "@snailycad/types";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll } from "lib/utils";
import { TabList } from "components/shared/TabList";
import { PendingUsersTab } from "components/admin/manage/users/PendingUsersTab";
import { Title } from "components/shared/Title";
import { Permissions } from "hooks/usePermission";
import { AllUsersTab } from "components/admin/manage/users/tabs/AllUsersTab";

interface Props {
  data: { users: User[]; pendingCount: number; totalCount: number };
}

export default function ManageUsers({ data }: Props) {
  const [users, setUsers] = React.useState<User[]>(data.users);

  const t = useTranslations("Management");
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

      <TabList tabs={tabs}>
        <AllUsersTab {...data} />

        <PendingUsersTab pendingCount={data.pendingCount} setUsers={setUsers} users={pending} />
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
