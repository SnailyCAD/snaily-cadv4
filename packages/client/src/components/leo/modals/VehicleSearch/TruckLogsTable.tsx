import { Table } from "components/shared/Table";
import { compareDesc } from "date-fns";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useTranslations } from "next-intl";
import type { VehicleSearchResult } from "../VehicleSearchModal";

interface Props {
  results: VehicleSearchResult;
}

export function TruckLogsTable({ results }: Props) {
  const t = useTranslations("TruckLogs");
  const { TRUCK_LOGS } = useFeatureEnabled();
  const truckLogs = results.TruckLog;

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
            driver: `${results.citizen.name} ${results.citizen.surname}`,
            vehicle: results.model.value?.value,
            startedAt: log.startedAt,
            endedAt: log.endedAt,
          }))}
        columns={[
          { Header: t("driver"), accessor: "driver" },
          { Header: t("vehicle"), accessor: "vehicle" },
          { Header: t("startedAt"), accessor: "startedAt" },
          { Header: t("endedAt"), accessor: "endedAt" },
        ]}
      />
    </div>
  );
}
