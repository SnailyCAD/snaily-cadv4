import * as React from "react";
import { useTranslations } from "use-intl";
import { Button, Loader, TabsContent } from "@snailycad/ui";
import { Record, RecordType } from "@snailycad/types";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { FullDate } from "components/shared/FullDate";
import { makeUnitName } from "lib/utils";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { ManageRecordModal } from "../modals/manage-record/manage-record-modal";
import useFetch from "lib/useFetch";
import { Status } from "components/shared/Status";
import { HoverCard } from "components/shared/HoverCard";
import { ViolationsColumn } from "../ViolationsColumn";
import type {
  GetManagePendingArrestReports,
  PostCitizenRecordLogsData,
} from "@snailycad/types/api";

interface Props {
  arrestReports: GetManagePendingArrestReports;
}

const TYPE_LABELS = {
  [RecordType.TICKET]: "Ticket",
  [RecordType.ARREST_REPORT]: "Arrest Report",
  [RecordType.WRITTEN_WARNING]: "Written Warning",
};

export function ArrestReportsTab({ arrestReports }: Props) {
  const [tempRecord, setTempRecord] = React.useState<Record | null>(null);

  const asyncTable = useAsyncTable({
    getKey: (item) => item.recordId ?? item.warrantId ?? item.id,
    fetchOptions: {
      onResponse: (data: GetManagePendingArrestReports) => ({
        data: data.arrestReports,
        totalCount: data.totalCount,
      }),
      path: "/admin/manage/pending-arrest-reports",
    },
    totalCount: arrestReports.totalCount,
    initialData: arrestReports.arrestReports,
  });

  const { openModal } = useModal();
  const { generateCallsign } = useGenerateCallsign();
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const tableState = useTableState();

  function handleViewClick(item: GetManagePendingArrestReports["arrestReports"][number]) {
    setTempRecord(item.records!);

    openModal(ModalIds.ManageRecord, {
      citizenName: `${item.citizen?.name} ${item.citizen?.surname}`,
      businessId: item.business?.id,
      businessName: item.business?.name,
    });
  }

  async function handleAcceptDeclineClick(item: Record, type: "ACCEPT" | "DECLINE") {
    const { json } = await execute<PostCitizenRecordLogsData>({
      path: `/admin/manage/records-logs/${item.id}`,
      method: "POST",
      data: { type },
    });

    if (json) {
      setTempRecord(null);
      asyncTable.remove(item.id);
    }
  }

  return (
    <TabsContent value="arrest-reports-tab">
      {asyncTable.isLoading && asyncTable.items.length >= 0 ? (
        <Loader />
      ) : asyncTable.items.length <= 0 ? (
        <p className="mt-5">{t("noCitizenLogs")}</p>
      ) : (
        <Table
          tableState={tableState}
          data={asyncTable.items.map((item) => {
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
              citizen: item.citizen ? `${item.citizen.name} ${item.citizen.surname}` : "—",
              business: item.business ? `${item.business.name}` : "—",
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
              status: <Status fallback="—">{record.status}</Status>,
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
            { header: t("business"), accessorKey: "business" },
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
