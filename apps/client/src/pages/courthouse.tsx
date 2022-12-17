import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { useTranslations } from "use-intl";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { TabList } from "components/shared/TabList";
import { ExpungementRequestsTab } from "components/courthouse/expungement-requests/ExpungementRequestsTab";
import { NameChangeRequestTab } from "components/courthouse/name-change/NameChangeRequestTab";
import { CourtEntriesTab } from "components/courthouse/court-entries/court-entries-tab";
import { usePermission, Permissions } from "hooks/usePermission";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { CourthousePostsTab } from "components/courthouse/courthouse-posts/CourthousePostsTab";
import type {
  GetCourtEntriesData,
  GetCourthousePostsData,
  GetExpungementRequestsData,
  GetNameChangeRequestsData,
} from "@snailycad/types/api";

interface Props {
  requests: GetExpungementRequestsData;
  nameChangeRequests: GetNameChangeRequestsData;
  courtEntries: GetCourtEntriesData;
  courthousePosts: GetCourthousePostsData;
}

export default function Courthouse(props: Props) {
  const t = useTranslations("Courthouse");
  const { COURTHOUSE_POSTS } = useFeatureEnabled();
  const { hasPermissions } = usePermission();
  const hasEntriesPerms = hasPermissions([Permissions.Leo], (u) => u.isLeo);

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
      <Title className="mb-3">{t("courthouse")}</Title>

      <TabList tabs={TABS}>
        <ExpungementRequestsTab requests={props.requests} />
        <NameChangeRequestTab requests={props.nameChangeRequests} />
        {hasEntriesPerms ? <CourtEntriesTab entries={props.courtEntries} /> : null}
        {COURTHOUSE_POSTS ? <CourthousePostsTab posts={props.courthousePosts} /> : null}
      </TabList>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const user = await getSessionUser(req);
  const [data, nameChangeRequests, courtEntries, courthousePosts] = await requestAll(req, [
    ["/expungement-requests", []],
    ["/name-change", []],
    ["/court-entries", []],
    ["/courthouse-posts", []],
  ]);

  return {
    props: {
      requests: data,
      nameChangeRequests,
      courtEntries,
      courthousePosts,
      session: user,
      messages: {
        ...(await getTranslations(["courthouse", "leo", "common"], user?.locale ?? locale)),
      },
    },
  };
};
