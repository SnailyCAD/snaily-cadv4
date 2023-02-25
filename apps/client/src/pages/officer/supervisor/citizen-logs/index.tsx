import { useTranslations } from "use-intl";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import type { Citizen, RecordLog } from "@snailycad/types";
import { Title } from "components/shared/Title";
import { Permissions } from "@snailycad/permissions";
import { TabList } from "@snailycad/ui";
import { CitizenLogsTab } from "components/leo/citizen-logs/citizen-logs-tab";
import { ArrestReportsTab } from "components/leo/citizen-logs/arrest-reports-tab";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import type { GetManagePendingArrestReports, GetManageRecordLogsData } from "@snailycad/types/api";

export type CitizenLog = RecordLog & { citizen: Citizen };
interface Props {
  citizens: GetManageRecordLogsData;
  arrestReports: GetManagePendingArrestReports;
}

export default function CitizenLogs(props: Props) {
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
        <CitizenLogsTab citizens={props.citizens} />
        {CITIZEN_RECORD_APPROVAL ? <ArrestReportsTab arrestReports={props.arrestReports} /> : null}
      </TabList>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  const [citizens, arrestReports] = await requestAll(req, [
    ["/admin/manage/records-logs", { citizens: [], totalCount: 0 }],
    ["/admin/manage/pending-arrest-reports", { arrestReports: [], totalCount: 0 }],
  ]);

  return {
    props: {
      session: user,
      arrestReports,
      citizens,
      messages: {
        ...(await getTranslations(["leo", "common"], user?.locale ?? locale)),
      },
    },
  };
};
