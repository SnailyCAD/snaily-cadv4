import * as React from "react";
import { useTranslations } from "use-intl";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { Rank, User, WhitelistStatus } from "@snailycad/types";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll } from "lib/utils";
import { TabList } from "components/shared/TabList";
import { PendingUsersTab } from "components/admin/manage/users/tabs/PendingUsersTab";
import { Title } from "components/shared/Title";
import { Permissions } from "hooks/usePermission";
import { AllUsersTab } from "components/admin/manage/users/tabs/AllUsersTab";

interface Props {
  data: { users: User[]; pendingCount: number; totalCount: number };
}

export default function ManageUsers({ data }: Props) {
  const t = useTranslations("Management");
  const pending = data.users.filter((v) => v.whitelistStatus === WhitelistStatus.PENDING);

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
        <PendingUsersTab {...data} users={pending} />
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
