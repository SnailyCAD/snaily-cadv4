import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { RecordType } from "@snailycad/types";
import { Table, useTableState } from "components/shared/Table";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { ArrowLeft } from "react-bootstrap-icons";
import { FullDate } from "components/shared/FullDate";
import { TabsContent } from "components/shared/TabList";
import type { CitizenLog } from "src/pages/officer/supervisor/citizen-logs";
import { makeUnitName } from "lib/utils";
import { ViolationsColumn } from "../ViolationsColumn";

interface Props {
  search: string;
  logs: CitizenLog[];
}

const TYPE_LABELS = {
  [RecordType.TICKET]: "Ticket",
  [RecordType.ARREST_REPORT]: "Arrest Report",
  [RecordType.WRITTEN_WARNING]: "Written Warning",
};

export function CitizenLogsTab({ search, logs: data }: Props) {
  const logs = React.useMemo(() => uniqueList(data), [data]);
  const [currentLog, setCurrentLog] = React.useState<CitizenLog | null>(null);

  const tableState = useTableState({ search: { value: search } });
  const { generateCallsign } = useGenerateCallsign();
  const t = useTranslations("Leo");
  const common = useTranslations("Common");

  return (
    <TabsContent value="citizen-logs-tab">
      {logs.length <= 0 ? (
        <p className="mt-5">{t("noCitizenLogs")}</p>
      ) : currentLog ? (
        <>
          <div className="flex items-center justify-between mt-5">
            <h3 className="text-xl font-semibold">
              {currentLog.citizen.name} {currentLog.citizen.surname}
            </h3>

            <Button className="flex items-center gap-2" onClick={() => setCurrentLog(null)}>
              <ArrowLeft />
              {"View all"}
            </Button>
          </div>

          <Table
            tableState={tableState}
            data={data
              .filter((v) => v.citizenId === currentLog.citizenId)
              .map((item) => {
                const type = item.records !== null ? TYPE_LABELS[item.records.type] : "Warrant";
                const createdAt = item.warrant?.createdAt ?? item.records?.createdAt;
                const officer = item.warrant?.officer ?? item.records?.officer;
                const officerName = officer && makeUnitName(officer);
                const callsign = officer && generateCallsign(officer);

                const extra = item.records
                  ? {
                      status: "—",
                      postal: item.records.postal || common("none"),
                      notes: item.records.notes || common("none"),
                      violations: <ViolationsColumn violations={item.records.violations} />,
                    }
                  : {
                      postal: "—",
                      status: item.warrant?.status,
                      violations: "—",
                      notes: "—",
                    };

                return {
                  id: item.id,
                  type,
                  citizen: `${item.citizen.name} ${item.citizen.surname}`,
                  officer: `${callsign} ${officerName}`,
                  ...extra,
                  createdAt: createdAt ? <FullDate>{createdAt}</FullDate> : "—",
                };
              })}
            columns={[
              { header: common("type"), accessorKey: "type" },
              { header: t("citizen"), accessorKey: "citizen" },
              { header: t("officer"), accessorKey: "officer" },
              { header: t("postal"), accessorKey: "postal" },
              { header: t("status"), accessorKey: "status" },
              { header: t("notes"), accessorKey: "notes" },
              { header: t("violations"), accessorKey: "violations" },
              { header: common("createdAt"), accessorKey: "createdAt" },
            ]}
          />
        </>
      ) : (
        <Table
          tableState={tableState}
          data={logs.map((item) => {
            return {
              id: item.id,
              citizen: `${item.citizen.name} ${item.citizen.surname}`,
              actions: (
                <Button size="xs" onClick={() => setCurrentLog(item)}>
                  {common("view")}
                </Button>
              ),
            };
          })}
          columns={[
            { header: t("citizen"), accessorKey: "citizen" },
            { header: common("actions"), accessorKey: "actions" },
          ]}
        />
      )}
    </TabsContent>
  );
}

function uniqueList(logs: CitizenLog[]) {
  const arr: CitizenLog[] = [];

  for (let i = 0; i < logs.length; i++) {
    const citizenId = logs[i]?.citizenId;

    if (arr.some((v) => v.citizenId === citizenId)) {
      continue;
    }

    arr.push(logs[i]!);
  }

  return arr;
}
