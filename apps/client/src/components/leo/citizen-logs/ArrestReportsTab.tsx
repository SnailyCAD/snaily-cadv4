import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "@snailycad/ui";
import { Record, RecordType, WhitelistStatus } from "@snailycad/types";
import { Table, useTableState } from "components/shared/Table";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { FullDate } from "components/shared/FullDate";
import { TabsContent } from "components/shared/TabList";
import type { CitizenLog } from "src/pages/officer/supervisor/citizen-logs";
import { makeUnitName } from "lib/utils";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { ManageRecordModal } from "../modals/ManageRecordModal";
import useFetch from "lib/useFetch";
import { Status } from "components/shared/Status";
import { useRouter } from "next/router";
import { HoverCard } from "components/shared/HoverCard";
import { ViolationsColumn } from "../ViolationsColumn";
import type { PostCitizenRecordLogsData } from "@snailycad/types/api";

interface Props {
  search: string;
  logs: CitizenLog[];
}

const TYPE_LABELS = {
  [RecordType.TICKET]: "Ticket",
  [RecordType.ARREST_REPORT]: "Arrest Report",
  [RecordType.WRITTEN_WARNING]: "Written Warning",
};

export function ArrestReportsTab({ search, logs: data }: Props) {
  const logs = React.useMemo(() => uniqueList(data), [data]);
  const [tempRecord, setTempRecord] = React.useState<Record | null>(null);

  const { openModal } = useModal();
  const { generateCallsign } = useGenerateCallsign();
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const router = useRouter();
  const tableState = useTableState({ search: { value: search } });

  function handleViewClick(item: CitizenLog) {
    setTempRecord(item.records!);
    openModal(ModalIds.ManageRecord, {
      citizenName: `${item.citizen.name} ${item.citizen.surname}`,
    });
  }

  async function handleAcceptDeclineClick(item: Record, type: "ACCEPT" | "DECLINE") {
    const { json } = await execute<PostCitizenRecordLogsData>({
      path: `/admin/manage/citizens/records-logs/${item.id}`,
      method: "POST",
      data: { type },
    });

    if (json.id) {
      setTempRecord(null);
      router.replace({
        pathname: router.pathname,
        query: router.query,
      });
    }
  }

  return (
    <TabsContent value="arrest-reports-tab">
      {logs.length <= 0 ? (
        <p className="mt-5">{t("noCitizenLogs")}</p>
      ) : (
        <Table
          tableState={tableState}
          data={logs.map((item) => {
            const record = item.records!;
            const type = TYPE_LABELS[record.type];
            const createdAt = record.createdAt;
            const officer = record.officer;
            const officerName = officer && makeUnitName(officer);
            const callsign = officer && generateCallsign(officer);

            return {
              id: item.id,
              caseNumber: `#${record.caseNumber}`,
              type,
              citizen: `${item.citizen.name} ${item.citizen.surname}`,
              officer: officer ? `${callsign} ${officerName}` : common("none"),
              postal: record.postal || common("none"),
              notes: (
                <HoverCard
                  trigger={
                    <span className="block max-w-[300px] truncate cursor-help">
                      {record.notes || common("none")}
                    </span>
                  }
                >
                  {record.notes}
                </HoverCard>
              ),
              violations: <ViolationsColumn violations={record.violations} />,
              createdAt: createdAt ? <FullDate>{createdAt}</FullDate> : "—",
              status: <Status state={record.status}>{record.status?.toLowerCase()}</Status>,
              actions: (
                <>
                  <Button size="xs" className="mr-2" onPress={() => handleViewClick(item)}>
                    {common("view")}
                  </Button>
                  <Button
                    variant="success"
                    size="xs"
                    className="mr-2"
                    onPress={() => handleAcceptDeclineClick(record, "ACCEPT")}
                    disabled={state === "loading"}
                  >
                    {common("accept")}
                  </Button>
                  <Button
                    variant="danger"
                    size="xs"
                    onPress={() => handleAcceptDeclineClick(record, "DECLINE")}
                    disabled={state === "loading"}
                  >
                    {common("decline")}
                  </Button>
                </>
              ),
            };
          })}
          columns={[
            { header: common("type"), accessorKey: "type" },
            { header: t("caseNumber"), accessorKey: "caseNumber" },
            { header: t("citizen"), accessorKey: "citizen" },
            { header: t("officer"), accessorKey: "officer" },
            { header: t("postal"), accessorKey: "postal" },
            { header: t("status"), accessorKey: "status" },
            { header: t("notes"), accessorKey: "notes" },
            { header: t("violations"), accessorKey: "violations" },
            { header: common("createdAt"), accessorKey: "createdAt" },
            { header: common("actions"), accessorKey: "actions" },
          ]}
        />
      )}

      {tempRecord ? (
        <ManageRecordModal
          id={ModalIds.ManageRecord}
          type={tempRecord.type}
          isEdit
          record={tempRecord}
          isReadOnly
        />
      ) : null}
    </TabsContent>
  );
}

function uniqueList(logs: CitizenLog[]) {
  const arrestReports: CitizenLog[] = [];

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i]!;

    const citizenId = log.citizenId;
    const isArrestReport = log.records?.type === RecordType.ARREST_REPORT;

    if (
      arrestReports.some((v) => v.citizenId === citizenId) ||
      !isArrestReport ||
      log.records?.status !== WhitelistStatus.PENDING
    ) {
      continue;
    }

    arrestReports.push(logs[i]!);
  }

  return arrestReports;
}
