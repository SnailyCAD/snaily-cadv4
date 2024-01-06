import { useTranslations } from "use-intl";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { RecordType, type Officer, type OfficerLog } from "@snailycad/types";
import { makeUnitName, requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { Permissions } from "@snailycad/permissions";
import type { GetMyRecordReports } from "@snailycad/types/api";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { FullDate, Status } from "@snailycad/ui";
import { ViolationsColumn } from "components/leo/ViolationsColumn";
import { RecordsCaseNumberColumn } from "components/leo/records-case-number-column";

export interface OfficerLogWithOfficer extends Omit<OfficerLog, "officer" | "emsFdDeputy"> {
  officer: Officer;
}

interface Props {
  reports: GetMyRecordReports;
}

export default function MyOfficersLogs({ reports: data }: Props) {
  const t = useTranslations("Leo");
  const common = useTranslations("Common");

  const { generateCallsign } = useGenerateCallsign();

  const TYPE_LABELS = {
    [RecordType.TICKET]: t("ticket"),
    [RecordType.ARREST_REPORT]: t("arrestReport"),
    [RecordType.WRITTEN_WARNING]: t("writtenWarning"),
  };

  const asyncTable = useAsyncTable({
    fetchOptions: {
      pageSize: 25,
      onResponse: (json: GetMyRecordReports) => ({
        data: json.reports,
        totalCount: json.totalCount,
      }),
      path: "/leo/my-record-reports",
    },
    totalCount: data.totalCount,
    initialData: data.reports,
  });
  const tableState = useTableState({ pagination: asyncTable.pagination });

  return (
    <Layout permissions={{ permissions: [Permissions.Leo] }} className="dark:text-white">
      <header>
        <Title className="!mb-1">{t("myRecordReports")}</Title>
        <p className="dark:text-gray-400 text-neutral-700">{t("myRecordReportsDescription")}</p>
      </header>

      {data.totalCount <= 0 ? (
        <p className="mt-5">{t("noReportsCreated")}</p>
      ) : (
        <Table
          data={asyncTable.items.map((item) => {
            const type = item.records !== null ? TYPE_LABELS[item.records.type] : t("warrant");
            const createdAt = item.warrant?.createdAt ?? item.records?.createdAt;
            const officer = item.warrant?.officer ?? item.records?.officer;
            const officerName = officer && makeUnitName(officer);
            const callsign = officer && generateCallsign(officer);

            const extra = item.records
              ? {
                  caseNumber: <RecordsCaseNumberColumn record={item.records} />,
                  status: <Status fallback="—">{item.records.status}</Status>,
                  postal: item.records.postal || common("none"),
                  notes: item.records.notes || common("none"),
                  violations: <ViolationsColumn violations={item.records.violations} />,
                  paymentStatus: <Status fallback="—">{item.records.paymentStatus}</Status>,
                }
              : {
                  caseNumber: <RecordsCaseNumberColumn record={item.warrant!} />,
                  status: item.warrant?.status,
                  postal: "—",
                  notes: "—",
                  violations: "—",
                };

            return {
              id: item.id,
              type,
              citizen: `${item.citizen?.name} ${item.citizen?.surname}`,
              officer: callsign && officerName ? `${callsign} ${officerName}` : "—",
              ...extra,
              createdAt: createdAt ? <FullDate>{createdAt}</FullDate> : "—",
            };
          })}
          columns={[
            { header: t("caseNumber"), accessorKey: "caseNumber" },
            { header: common("type"), accessorKey: "type" },
            { header: t("citizen"), accessorKey: "citizen" },
            { header: t("officer"), accessorKey: "officer" },
            { header: t("postal"), accessorKey: "postal" },
            { header: t("status"), accessorKey: "status" },
            { header: t("paymentStatus"), accessorKey: "paymentStatus" },
            { header: t("notes"), accessorKey: "notes" },
            { header: t("violations"), accessorKey: "violations" },
            { header: common("createdAt"), accessorKey: "createdAt" },
          ]}
          tableState={tableState}
        />
      )}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  const [reports] = await requestAll(req, [
    ["/leo/my-record-reports", { reports: [], totalCount: 0 }],
  ]);

  return {
    props: {
      session: user,
      reports,
      messages: {
        ...(await getTranslations(["leo", "common"], user?.locale ?? locale)),
      },
    },
  };
};
