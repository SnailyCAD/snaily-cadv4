import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { useTranslations } from "use-intl";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { TabList } from "@snailycad/ui";
import { ExpungementRequestsTab } from "components/courthouse/expungement-requests/ExpungementRequestsTab";
import { NameChangeRequestTab } from "components/courthouse/name-change/NameChangeRequestTab";
import { CourtEntriesTab } from "components/courthouse/court-entries/court-entries-tab";
import { usePermission, Permissions } from "hooks/usePermission";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { CourthousePostsTab } from "components/courthouse/courthouse-posts/CourthousePostsTab";
import type { GetExpungementRequestsData, GetNameChangeRequestsData } from "@snailycad/types/api";
import Link from "next/link";
import { BoxArrowUpRight } from "react-bootstrap-icons";
import { defaultPermissions } from "@snailycad/permissions";

interface Props {
  requests: GetExpungementRequestsData;
  nameChangeRequests: GetNameChangeRequestsData;
}

export default function Courthouse(props: Props) {
  const t = useTranslations("Courthouse");
  const { COURTHOUSE_POSTS } = useFeatureEnabled();
  const { hasPermissions } = usePermission();
  const hasEntriesPerms = hasPermissions([Permissions.Leo], (u) => u.isLeo);

  const hasCourthouseAdminPerms = hasPermissions(
    defaultPermissions.defaultCourthousePermissions,
    (u) => u.isSupervisor,
  );

  const TABS = [
    { name: t("expungementRequests"), value: "expungementRequestsTab" },
    { name: t("nameChangeRequests"), value: "nameChangeRequestsTab" },
  ];

  if (hasEntriesPerms) {
    TABS[2] = { name: t("courtEntries"), value: "courtEntriesTab" };
  }

  if (COURTHOUSE_POSTS) {
    const idx = hasEntriesPerms ? 3 : 2;
    TABS[idx] = { name: t("courthousePosts"), value: "courthousePosts" };
  }

  return (
    <Layout className="dark:text-white">
      <header className="flex items-center justify-between">
        <Title className="mb-3">{t("courthouse")}</Title>

        {hasCourthouseAdminPerms ? (
          <Link className="underline flex items-center gap-2" href="/admin/manage/courthouse">
            {t("courthouseManagement")}
            <BoxArrowUpRight />
          </Link>
        ) : null}
      </header>

      <TabList tabs={TABS}>
        <ExpungementRequestsTab requests={props.requests} />
        <NameChangeRequestTab requests={props.nameChangeRequests} />
        {hasEntriesPerms ? <CourtEntriesTab /> : null}
        {COURTHOUSE_POSTS ? <CourthousePostsTab /> : null}
      </TabList>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const user = await getSessionUser(req);
  const [data, nameChangeRequests] = await requestAll(req, [
    ["/expungement-requests", []],
    ["/name-change", []],
  ]);

  return {
    props: {
      requests: data,
      nameChangeRequests,
      session: user,
      messages: {
        ...(await getTranslations(["courthouse", "leo", "common"], user?.locale ?? locale)),
      },
    },
  };
};
