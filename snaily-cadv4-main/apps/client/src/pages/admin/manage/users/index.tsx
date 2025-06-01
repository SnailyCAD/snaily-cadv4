import { useTranslations } from "use-intl";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { WhitelistStatus } from "@snailycad/types";
import { AdminLayout } from "components/admin/AdminLayout";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { Permissions, usePermission } from "hooks/usePermission";
import { AllUsersTab } from "components/admin/manage/users/tabs/all-users-tab";
import type { GetManageUsersData } from "@snailycad/types/api";
import { TabList, Button } from "@snailycad/ui";
import { ModalIds } from "types/modal-ids";
import { useModal } from "state/modalState";
import dynamic from "next/dynamic";

const PendingUsersTab = dynamic(
  async () =>
    (await import("components/admin/manage/users/tabs/pending-users-tab")).PendingUsersTab,
);

interface Props {
  data: GetManageUsersData;
}

export default function ManageUsers({ data }: Props) {
  const t = useTranslations("Management");
  const pending = data.users.filter((v) => v.whitelistStatus === WhitelistStatus.PENDING);
  const modalState = useModal();
  const { hasPermissions } = usePermission();

  const hasManagePermissions = hasPermissions([
    Permissions.ManageUsers,
    Permissions.BanUsers,
    Permissions.DeleteUsers,
  ]);

  const tabs = [
    { name: `${t("allUsers")} (${data.totalCount})`, value: "allUsers" },
    { name: `${t("pendingUsers")} (${data.pendingCount})`, value: "pendingUsers" },
  ];

  return (
    <AdminLayout
      permissions={{
        permissions: [
          Permissions.BanUsers,
          Permissions.ViewUsers,
          Permissions.ManageUsers,
          Permissions.DeleteUsers,
        ],
      }}
    >
      <header className="flex items-center justify-between">
        <Title>{t("MANAGE_USERS")}</Title>

        {hasManagePermissions ? (
          <div>
            <Button onPress={() => modalState.openModal(ModalIds.PruneUsers)}>
              {t("pruneUsers")}
            </Button>
          </div>
        ) : null}
      </header>

      <TabList tabs={tabs}>
        <AllUsersTab {...data} />
        <PendingUsersTab {...data} users={pending} />
      </TabList>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const [usersData] = await requestAll(req, [
    ["/admin/manage/users", { users: [], totalCount: 0 }],
  ]);
  const user = await getSessionUser(req);

  return {
    props: {
      data: usersData,
      session: user,
      messages: {
        ...(await getTranslations(
          ["citizen", "admin", "values", "common"],
          user?.locale ?? locale,
        )),
      },
    },
  };
};
