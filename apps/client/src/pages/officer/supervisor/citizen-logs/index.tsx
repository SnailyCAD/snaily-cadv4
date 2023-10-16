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
import { PendingCitizenRecordsTab } from "components/leo/citizen-logs/pending-citizen-logs-tab";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import type { GetManagePendingCitizenRecords, GetManageRecordLogsData } from "@snailycad/types/api";

export type CitizenLog = RecordLog & { citizen: Citizen };
interface Props {
  citizens: GetManageRecordLogsData;
  pendingCitizenRecords: GetManagePendingCitizenRecords;
}

export default function CitizenLogs(props: Props) {
  const { CITIZEN_RECORD_APPROVAL } = useFeatureEnabled();

  const t = useTranslations("Leo");

  const TABS = [{ value: "citizen-logs-tab", name: t("citizenLogs") }];

  if (CITIZEN_RECORD_APPROVAL) {
    TABS[1] = { value: "pending-citizen-records-tab", name: t("pendingCitizenRecords") };
  }

  return (
    <Layout
      permissions={{
        permissions: [Permissions.ViewCitizenLogs, Permissions.DeleteCitizenRecords],
      }}
      className="dark:text-white"
    >
      <header className="mb-5">
        <Title>{t("citizenLogs")}</Title>
        <p className="max-w-2xl mt-2 text-neutral-700 dark:text-gray-400">
          {t("citizenLogsDescription")}
        </p>
      </header>

      <TabList tabs={TABS}>
        <CitizenLogsTab citizens={props.citizens} />
        {CITIZEN_RECORD_APPROVAL ? (
          <PendingCitizenRecordsTab pendingCitizenRecords={props.pendingCitizenRecords} />
        ) : null}
      </TabList>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  const [citizens, pendingCitizenRecords] = await requestAll(req, [
    ["/admin/manage/records-logs", { citizens: [], totalCount: 0 }],
    ["/admin/manage/pending-citizen-records", { pendingCitizenRecords: [], totalCount: 0 }],
  ]);

  return {
    props: {
      session: user,
      pendingCitizenRecords,
      citizens,
      messages: {
        ...(await getTranslations(
          ["leo", "common", "courthouse", "citizen"],
          user?.locale ?? locale,
        )),
      },
    },
  };
};
