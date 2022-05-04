import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { Record, RecordType } from "@snailycad/types";
import { Table } from "components/shared/Table";
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

  function handleViewClick(item: CitizenLog) {
    setTempRecord(item.records!);
    openModal(ModalIds.ManageRecord, {
      citizenName: `${item.citizen.name} ${item.citizen.surname}`,
    });
  }

  async function handleAcceptDeclineClick(item: Record, type: "ACCEPT" | "DECLINE") {
    const { json } = await execute(`/admin/manage/records-logs/${item.id}`, {
      method: "POST",
      data: { type },
    });

    console.log({ json });
  }

  return (
    <TabsContent value="arrest-reports-tab">
      {logs.length <= 0 ? (
        <p className="mt-5">{t("noCitizenLogs")}</p>
      ) : (
        <Table
          filter={search}
          defaultSort={{
            columnId: "createdAt",
            descending: true,
          }}
          data={logs.map((item) => {
            const record = item.records!;
            const type = TYPE_LABELS[record.type];
            const createdAt = record.createdAt;
            const officer = record.officer;
            const officerName = makeUnitName(officer);
            const callsign = generateCallsign(officer);

            return {
              type,
              citizen: `${item.citizen.name} ${item.citizen.surname}`,
              officer: `${callsign} ${officerName}`,
              postal: record.postal || common("none"),
              notes: record.notes || common("none"),
              violations:
                record.violations.map((v) => v.penalCode.title).join(", ") || common("none"),
              createdAt: createdAt ? <FullDate>{createdAt}</FullDate> : "—",
              status: <Status state={record.status}>{record.status?.toLowerCase()}</Status>,
              actions: (
                <>
                  <Button small className="mr-2" onClick={() => handleViewClick(item)}>
                    {common("view")}
                  </Button>
                  <Button
                    variant="success"
                    small
                    className="mr-2"
                    onClick={() => handleAcceptDeclineClick(record, "ACCEPT")}
                    disabled={state === "loading"}
                  >
                    {common("accept")}
                  </Button>
                  <Button
                    variant="danger"
                    small
                    onClick={() => handleAcceptDeclineClick(record, "DECLINE")}
                    disabled={state === "loading"}
                  >
                    {common("decline")}
                  </Button>
                </>
              ),
            };
          })}
          columns={[
            { Header: common("type"), accessor: "type" },
            { Header: t("citizen"), accessor: "citizen" },
            { Header: t("officer"), accessor: "officer" },
            { Header: t("postal"), accessor: "postal" },
            { Header: t("status"), accessor: "status" },
            { Header: t("notes"), accessor: "notes" },
            { Header: t("violations"), accessor: "violations" },
            { Header: common("createdAt"), accessor: "createdAt" },
            { Header: common("actions"), accessor: "actions" },
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
    const citizenId = logs[i]?.citizenId;
    const isArrestReport = logs[i]?.records?.type === RecordType.ARREST_REPORT;

    if (arrestReports.some((v) => v.citizenId === citizenId) || !isArrestReport) {
      continue;
    }

    arrestReports.push(logs[i]!);
  }

  return arrestReports;
}
