import { TabList } from "components/shared/TabList";
import { useTranslations } from "use-intl";
import { BusinessSearchEmployeesTab } from "./employees-tab";
import { BusinessSearchVehiclesTab } from "./vehicles.tab";

export function BusinessSearchTabsContainer() {
  const t = useTranslations();

  const TABS = [
    { name: t("Business.employees"), value: "business-search-employees-tab" },
    { name: t("Leo.vehicles"), value: "business-search-vehicles-tab" },
  ];

  return (
    <div className="mt-3">
      <TabList tabs={TABS}>
        <BusinessSearchEmployeesTab />
        <BusinessSearchVehiclesTab />
      </TabList>
    </div>
  );
}
