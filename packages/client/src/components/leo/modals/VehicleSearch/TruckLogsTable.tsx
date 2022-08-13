import { Table } from "components/shared/Table";
import { compareDesc } from "date-fns";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useTranslations } from "next-intl";
import type { VehicleSearchResult } from "state/search/vehicleSearchState";

interface Props {
  result: VehicleSearchResult;
}

export function TruckLogsTable({ result }: Props) {
  const t = useTranslations("TruckLogs");
  const { TRUCK_LOGS } = useFeatureEnabled();
  const truckLogs = result.TruckLog;

  /** return null if truck-logs are disabled, or if there are no truck-logs for this plate. */
  if (!TRUCK_LOGS || truckLogs.length <= 0) {
    return null;
  }

  return (
    <div className="mt-5">
      <h4 className="text-xl font-semibold">{t("truckLogs")}</h4>

      <Table
        data={truckLogs
          .sort((a, b) => compareDesc(new Date(a.createdAt), new Date(b.createdAt)))
          .map((log) => ({
            driver: `${result.citizen.name} ${result.citizen.surname}`,
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
