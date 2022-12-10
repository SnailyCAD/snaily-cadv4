import { useTranslations } from "use-intl";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import type { Citizen, RecordLog } from "@snailycad/types";
import { Title } from "components/shared/Title";
import { Permissions } from "@snailycad/permissions";
import { TabList } from "components/shared/TabList";
import { CitizenLogsTab } from "components/leo/citizen-logs/citizen-logs-tab";
import { ArrestReportsTab } from "components/leo/citizen-logs/ArrestReportsTab";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import type { GetManageRecordLogsData } from "@snailycad/types/api";

export type CitizenLog = RecordLog & { citizen: Citizen };
interface Props {
  citizens: GetManageRecordLogsData;
}

export default function CitizenLogs({ citizens }: Props) {
  const { CITIZEN_RECORD_APPROVAL } = useFeatureEnabled();

  const t = useTranslations("Leo");

  const TABS = [{ value: "citizen-logs-tab", name: t("citizenLogs") }];

  if (CITIZEN_RECORD_APPROVAL) {
    TABS[1] = { value: "arrest-reports-tab", name: t("arrestReportLogs") };
  }

  return (
    <Layout
      permissions={{
        fallback: (u) => u.isLeo,
        permissions: [Permissions.ViewCitizenLogs, Permissions.DeleteCitizenRecords],
      }}
      className="dark:text-white"
    >
      <Title>{t("citizenLogs")}</Title>

      <TabList tabs={TABS}>
        <CitizenLogsTab citizens={citizens} />
        {CITIZEN_RECORD_APPROVAL ? <ArrestReportsTab logs={citizens} /> : null}
      </TabList>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  const [citizens] = await requestAll(req, [
    ["/admin/manage/citizens/records-logs", { citizens: [], totalCount: 0 }],
  ]);

  return {
    props: {
      session: user,
      citizens,
      messages: {
        ...(await getTranslations(["leo", "common"], user?.locale ?? locale)),
      },
    },
  };
};
