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
import { FullDate } from "components/shared/FullDate";
import { ViolationsColumn } from "components/leo/ViolationsColumn";
import { Status } from "components/shared/Status";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import Link from "next/link";
import { buttonSizes, buttonVariants } from "@snailycad/ui";
import { classNames } from "lib/classNames";
import { ArrowLeft } from "react-bootstrap-icons";
import { RecordsCaseNumberColumn } from "components/leo/records-case-number-column";

export type CitizenLog = RecordLog & { citizen: Citizen };
interface Props {
  recordLogs: GetManageRecordsLogsCitizenData;
}

const TYPE_LABELS = {
  [RecordType.TICKET]: "Ticket",
  [RecordType.ARREST_REPORT]: "Arrest Report",
  [RecordType.WRITTEN_WARNING]: "Written Warning",
};

export default function CitizenLogs(props: Props) {
  const { query } = useRouter();

  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { generateCallsign } = useGenerateCallsign();

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
        fallback: (u) => u.isLeo,
        permissions: [Permissions.ViewCitizenLogs, Permissions.DeleteCitizenRecords],
      }}
      className="dark:text-white"
    >
      <div className="flex items-center justify-between mt-5">
        <Title>{t("citizenLogs")}</Title>

        <Link
          className={classNames(
            "flex items-center gap-3 rounded-md",
            buttonSizes.sm,
            buttonVariants.default,
          )}
          href="/officer/supervisor/citizen-logs"
        >
          <ArrowLeft /> View all record logs
        </Link>
      </div>

      <Table
        tableState={tableState}
        data={asyncTable.items.map((item) => {
          const type = item.records !== null ? TYPE_LABELS[item.records.type] : "Warrant";
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
