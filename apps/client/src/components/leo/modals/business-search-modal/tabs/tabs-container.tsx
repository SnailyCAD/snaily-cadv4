import { RecordType } from "@snailycad/types";
import { TabList } from "components/shared/TabList";
import { useBusinessSearch } from "state/search/business-search-state";
import { useTranslations } from "use-intl";
import { RecordsTab } from "../../NameSearchModal/tabs/records-tab";
import { BusinessSearchEmployeesTab } from "./employees-tab";
import { BusinessSearchVehiclesTab } from "./vehicles.tab";

export function BusinessSearchTabsContainer() {
  const t = useTranslations();

  const currentResult = useBusinessSearch((state) => state.currentResult);

  if (!currentResult) {
    return null;
  }

  const ticketsLength = currentResult.Record.filter((v) => v.type === RecordType.TICKET).length;
  const arrestReportsLength = currentResult.Record.filter(
    (v) => v.type === RecordType.ARREST_REPORT,
  ).length;
  const writtenWarningsLength = currentResult.Record.filter(
    (v) => v.type === RecordType.WRITTEN_WARNING,
  ).length;

  const TABS = [
    { name: t("Business.employees"), value: "business-search-employees-tab" },
    { name: t("Leo.vehicles"), value: "business-search-vehicles-tab" },
    { value: "tickets", name: `${t("Leo.tickets")} (${ticketsLength})` },
    { value: "arrestReports", name: `${t("Leo.arrestReports")} (${arrestReportsLength})` },
    { value: "writtenWarnings", name: `${t("Leo.writtenWarnings")} (${writtenWarningsLength})` },
  ];

  return (
    <div className="mt-3">
      <TabList tabs={TABS}>
        <BusinessSearchEmployeesTab />
        <BusinessSearchVehiclesTab />
        <RecordsTab records={currentResult.Record} />
      </TabList>
    </div>
  );
}
