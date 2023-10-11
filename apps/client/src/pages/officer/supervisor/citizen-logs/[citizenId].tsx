import { useTranslations } from "use-intl";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { makeUnitName, requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import { Citizen, RecordLog, RecordType } from "@snailycad/types";
import { Title } from "components/shared/Title";
import { Permissions } from "@snailycad/permissions";
import type { GetManageRecordsLogsCitizenData } from "@snailycad/types/api";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import { useRouter } from "next/router";
import { ViolationsColumn } from "components/leo/ViolationsColumn";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import Link from "next/link";
import { FullDate, Status, buttonVariants } from "@snailycad/ui";
import { ArrowLeft } from "react-bootstrap-icons";
import { RecordsCaseNumberColumn } from "components/leo/records-case-number-column";

export type CitizenLog = RecordLog & { citizen: Citizen };
interface Props {
  recordLogs: GetManageRecordsLogsCitizenData;
}

export default function CitizenLogs(props: Props) {
  const { query } = useRouter();

  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { generateCallsign } = useGenerateCallsign();

  const TYPE_LABELS = {
    [RecordType.TICKET]: t("ticket"),
    [RecordType.ARREST_REPORT]: t("arrestReport"),
    [RecordType.WRITTEN_WARNING]: t("writtenWarning"),
  };

  const asyncTable = useAsyncTable({
    totalCount: props.recordLogs.totalCount,
    initialData: props.recordLogs.recordsLogs,
    fetchOptions: {
      path: `/admin/manage/records-logs/${query.citizenId}`,
      onResponse: (data: GetManageRecordsLogsCitizenData) => ({
        data: data.recordsLogs,
        totalCount: data.totalCount,
      }),
    },
  });
  const tableState = useTableState({ pagination: asyncTable.pagination });

  return (
    <Layout
      permissions={{
        permissions: [Permissions.ViewCitizenLogs, Permissions.DeleteCitizenRecords],
      }}
      className="dark:text-white"
    >
      <div className="flex items-center justify-between mt-5">
        <Title>{t("citizenLogs")}</Title>

        <Link
          className={buttonVariants({ className: "flex items-center gap-2" })}
          href="/officer/supervisor/citizen-logs"
        >
          <ArrowLeft /> {t("viewAllRecordLogs")}
        </Link>
      </div>

      <Table
        tableState={tableState}
        data={asyncTable.items.map((item) => {
          const type = item.records !== null ? TYPE_LABELS[item.records.type] : t("warrant");
          const createdAt = item.records?.createdAt ?? item.warrant?.createdAt;
          const officer = item.records?.officer ?? item.warrant?.officer;

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
                caseNumber: "—",
                status: item.warrant?.status,
                postal: "—",
                notes: "—",
                violations: "—",
              };

          return {
            id: item.id,
            type,
            citizen: `${item.citizen?.name} ${item.citizen?.surname}`,
            officer: officer ? `${makeUnitName(officer)} ${generateCallsign(officer)}` : "—",
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
      />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, query, locale }) => {
  const user = await getSessionUser(req);
  const citizenId = query.citizenId as string;
  const [recordLogs] = await requestAll(req, [
    [`/admin/manage/records-logs/${citizenId}`, { recordLogs: [], totalCount: 0 }],
  ]);

  return {
    props: {
      session: user,
      recordLogs,
      messages: {
        ...(await getTranslations(["leo", "common"], user?.locale ?? locale)),
      },
    },
  };
};
