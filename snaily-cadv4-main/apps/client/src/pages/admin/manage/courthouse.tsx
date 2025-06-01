import { defaultPermissions } from "@snailycad/permissions";
import type {
  GetManageExpungementRequests,
  GetManageNameChangeRequests,
} from "@snailycad/types/api";
import { AdminLayout } from "components/admin/AdminLayout";
import { ExpungementRequestsTab } from "components/admin/manage/courthouse/expungement-requests-tab";
import { NameChangeRequestsTab } from "components/admin/manage/courthouse/name-change-requests-tab";
import { PendingWarrantsTab } from "components/admin/manage/courthouse/pending-warrants-tab";
import { TabList } from "@snailycad/ui";
import { Title } from "components/shared/Title";
import { Permissions, usePermission } from "hooks/usePermission";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import { useTranslations } from "next-intl";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { CourthouseType } from "@snailycad/types";

interface Props {
  expungementRequests: GetManageExpungementRequests;
  nameChangeRequests: GetManageNameChangeRequests;
}

export default function ManageCourthouse({ expungementRequests, nameChangeRequests }: Props) {
  const { hasPermissions } = usePermission();
  const t = useTranslations("Management");
  const { options } = useFeatureEnabled();

  const hasNameChangePerms = hasPermissions([
    Permissions.ViewNameChangeRequests,
    Permissions.ManageNameChangeRequests,
  ]);

  const hasExpungementPerms = hasPermissions([
    Permissions.ViewExpungementRequests,
    Permissions.ManageExpungementRequests,
  ]);

  const enabledTypes = options.COURTHOUSE;

  const expungementRequestsEnabled = enabledTypes.includes(CourthouseType.EXPUNGEMENT_REQUEST);
  const nameChangeRequestsEnabled = enabledTypes.includes(CourthouseType.NAME_CHANGE_REQUEST);

  const hasManageWarrantPerms = hasPermissions([Permissions.ManagePendingWarrants]);

  const TABS = [];

  if (hasExpungementPerms && expungementRequestsEnabled) {
    TABS.push({ value: "expungement-requests", name: t("MANAGE_EXPUNGEMENT_REQUESTS") });
  }

  if (hasNameChangePerms && nameChangeRequestsEnabled) {
    TABS.push({ value: "name-change-requests", name: t("MANAGE_NAME_CHANGE_REQUESTS") });
  }

  if (hasManageWarrantPerms) {
    TABS.push({ value: "pending-warrants", name: t("MANAGE_PENDING_WARRANTS") });
  }

  return (
    <AdminLayout
      permissions={{
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
        {hasManageWarrantPerms ? <PendingWarrantsTab /> : null}
      </TabList>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  const [nameChangeRequests, expungementRequests] = await requestAll(req, [
    ["/admin/manage/name-change-requests", { totalCount: 0, pendingNameChangeRequests: [] }],
    ["/admin/manage/expungement-requests", { totalCount: 0, pendingExpungementRequests: [] }],
  ]);

  return {
    props: {
      nameChangeRequests,
      expungementRequests,
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
