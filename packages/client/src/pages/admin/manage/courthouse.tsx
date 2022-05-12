import { NameChangeRequest, Rank } from "@snailycad/types";
import { AdminLayout } from "components/admin/AdminLayout";
import { ExpungementRequestsTab } from "components/admin/manage/courthouse/ExpungementRequestsTab";
import { NameChangeRequestsTab } from "components/admin/manage/courthouse/NameChangeRequestsTab";
import { TabList } from "components/shared/TabList";
import { Title } from "components/shared/Title";
import { Permissions, usePermission } from "hooks/usePermission";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import { useTranslations } from "next-intl";
import type { FullRequest } from "src/pages/courthouse";

interface Props {
  expungementRequests: FullRequest[];
  nameChangeRequests: NameChangeRequest[];
}

export default function ManageCourthouse({ expungementRequests, nameChangeRequests }: Props) {
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

  const TABS = [];

  if (hasExpungementPerms) {
    TABS.push({ value: "expungement-requests", name: t("MANAGE_EXPUNGEMENT_REQUESTS") });
  }

  if (hasNameChangePerms) {
    TABS.push({ value: "name-change-requests", name: t("MANAGE_NAME_CHANGE_REQUESTS") });
  }

  return (
    <AdminLayout
      permissions={{
        fallback: (u) => u.rank !== Rank.USER,
        permissions: [
          Permissions.ViewNameChangeRequests,
          Permissions.ManageNameChangeRequests,
          Permissions.ViewExpungementRequests,
          Permissions.ManageExpungementRequests,
        ],
      }}
    >
      <header className="mb-5">
        <Title>{t("MANAGE_COURTHOUSE")}</Title>
        <p className="text-neutral-700 dark:text-gray-400 my-2">
          Here you can manage expungement requests and name change requests.
        </p>
      </header>

      <TabList tabs={TABS}>
        {hasExpungementPerms ? <ExpungementRequestsTab requests={expungementRequests} /> : null}
        {hasNameChangePerms ? <NameChangeRequestsTab requests={nameChangeRequests} /> : null}
      </TabList>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const [nameChangeRequests, expungementRequests] = await requestAll(req, [
    ["/admin/manage/name-change-requests", []],
    ["/admin/manage/expungement-requests", []],
  ]);

  return {
    props: {
      nameChangeRequests,
      expungementRequests,
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["admin", "courthouse", "values", "common"], locale)),
      },
    },
  };
};
