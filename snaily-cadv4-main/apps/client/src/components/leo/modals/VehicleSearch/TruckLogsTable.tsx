import { Table, useTableState } from "components/shared/Table";
import { compareDesc } from "date-fns";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useTranslations } from "next-intl";
import type { VehicleSearchResult } from "state/search/vehicle-search-state";

interface Props {
  result: VehicleSearchResult;
}

export function TruckLogsTable({ result }: Props) {
  const t = useTranslations("TruckLogs");
  const common = useTranslations("Common");
  const { TRUCK_LOGS } = useFeatureEnabled();
  const truckLogs = result.TruckLog;
  const tableState = useTableState();

  /** return null if truck-logs are disabled, or if there are no truck-logs for this plate. */
  if (!TRUCK_LOGS || truckLogs.length <= 0) {
    return null;
  }

  return (
    <div className="mt-5">
      <h4 className="text-xl font-semibold">{t("truckLogs")}</h4>

      <Table
        features={{ isWithinCardOrModal: true }}
        tableState={tableState}
        data={truckLogs
          .sort((a, b) => compareDesc(new Date(a.createdAt), new Date(b.createdAt)))
          .map((log) => ({
            id: log.id,
            driver: result.citizen
              ? `${result.citizen.name} ${result.citizen.surname}`
              : common("unknown"),
            vehicle: result.model.value?.value,
            startedAt: log.startedAt,
            endedAt: log.endedAt,
          }))}
        columns={[
          { header: t("driver"), accessorKey: "driver" },
          { header: t("vehicle"), accessorKey: "vehicle" },
          { header: t("startedAt"), accessorKey: "startedAt" },
          { header: t("endedAt"), accessorKey: "endedAt" },
        ]}
      />
    </div>
  );
}
