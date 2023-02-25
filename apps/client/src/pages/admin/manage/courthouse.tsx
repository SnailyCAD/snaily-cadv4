import { defaultPermissions } from "@snailycad/permissions";
import { Rank } from "@snailycad/types";
import type {
  GetManageExpungementRequests,
  GetManageNameChangeRequests,
  GetManagePendingWarrants,
} from "@snailycad/types/api";
import { AdminLayout } from "components/admin/AdminLayout";
import { ExpungementRequestsTab } from "components/admin/manage/courthouse/ExpungementRequestsTab";
import { NameChangeRequestsTab } from "components/admin/manage/courthouse/NameChangeRequestsTab";
import { PendingWarrantsTab } from "components/admin/manage/courthouse/PendingWarrantsTab";
import { TabList } from "@snailycad/ui";
import { Title } from "components/shared/Title";
import { Permissions, usePermission } from "hooks/usePermission";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import { useTranslations } from "next-intl";

interface Props {
  expungementRequests: GetManageExpungementRequests;
  nameChangeRequests: GetManageNameChangeRequests;
  pendingWarrants: GetManagePendingWarrants;
}

export default function ManageCourthouse({
  expungementRequests,
  nameChangeRequests,
  pendingWarrants,
}: Props) {
  const { hasPermissions } = usePermission();
  const t = useTranslations("Management");

  const hasNameChangePerms = hasPermissions(
    [Permissions.ViewNameChangeRequests, Permissions.ManageNameChangeRequests],
    true,
  );

  const hasExpungementPerms = hasPermissions(
    [Permissions.ViewExpungementRequests, Permissions.ManageExpungementRequests],
    true,
  );

  const hasManageWarrantPerms = hasPermissions([Permissions.ManagePendingWarrants], true);

  const TABS = [];

  if (hasExpungementPerms) {
    TABS.push({ value: "expungement-requests", name: t("MANAGE_EXPUNGEMENT_REQUESTS") });
  }

  if (hasNameChangePerms) {
    TABS.push({ value: "name-change-requests", name: t("MANAGE_NAME_CHANGE_REQUESTS") });
  }

  if (hasManageWarrantPerms) {
    TABS.push({ value: "pending-warrants", name: t("MANAGE_PENDING_WARRANTS") });
  }

  return (
    <AdminLayout
      permissions={{
        fallback: (u) => u.rank !== Rank.USER,
        permissions: defaultPermissions.defaultCourthousePermissions,
      }}
    >
      <header className="mb-5">
        <Title>{t("MANAGE_COURTHOUSE")}</Title>
        <p className="text-neutral-700 dark:text-gray-400 my-2">
          {t("manageCourthouseDescription")}
        </p>
      </header>

      <TabList tabs={TABS}>
        {hasExpungementPerms ? <ExpungementRequestsTab requests={expungementRequests} /> : null}
        {hasNameChangePerms ? <NameChangeRequestsTab requests={nameChangeRequests} /> : null}
        {hasManageWarrantPerms ? <PendingWarrantsTab warrants={pendingWarrants} /> : null}
      </TabList>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  const [nameChangeRequests, expungementRequests, pendingWarrants] = await requestAll(req, [
    ["/admin/manage/name-change-requests", []],
    ["/admin/manage/expungement-requests", []],
    ["/admin/manage/pending-warrants", []],
  ]);

  return {
    props: {
      nameChangeRequests,
      expungementRequests,
      pendingWarrants,
      session: user,
      messages: {
        ...(await getTranslations(
          ["admin", "courthouse", "values", "common", "leo"],
          user?.locale ?? locale,
        )),
      },
    },
  };
};
