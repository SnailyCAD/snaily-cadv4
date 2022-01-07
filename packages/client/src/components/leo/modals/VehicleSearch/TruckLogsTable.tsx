import { Table } from "components/table/Table";
import { compareDesc } from "date-fns";
import { useTranslations } from "next-intl";
import { VehicleSearchResult } from "../VehicleSearchModal";

interface Props {
  results: VehicleSearchResult;
}

export function TruckLogsTable({ results }: Props) {
  const t = useTranslations("TruckLogs");
  const truckLogs = results.TruckLog;

  if (truckLogs.length <= 0) {
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
