import { TabList } from "@snailycad/ui";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { NameSearchVehiclesTab } from "./vehicles-tab";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { NameSearchWarrantsTab } from "./warrants-tab";
import { RecordsTab } from "./records-tab";
import { useNameSearch } from "state/search/name-search-state";
import { RecordType } from "@snailycad/types";
import { shallow } from "zustand/shallow";

const NameSearchWeaponsTab = dynamic(
  async () => (await import("./weapons-tab")).NameSearchWeaponsTab,
);
const NameSearchNotesTabs = dynamic(async () => (await import("./notes-tab")).NotesTab);

export function NameSearchTabsContainer() {
  const { WEAPON_REGISTRATION } = useFeatureEnabled();
  const t = useTranslations();
  const { currentResult, setCurrentResult } = useNameSearch(
    (state) => ({
      currentResult: state.currentResult,
      setCurrentResult: state.setCurrentResult,
    }),
    shallow,
  );

  if (!currentResult || currentResult.isConfidential) {
    return null;
  }

  const vehiclesLength = currentResult.vehicles.length;
  const weaponsLength = currentResult.weapons.length;

  const ticketsLength = currentResult.Record.filter((v) => v.type === RecordType.TICKET).length;
  const arrestReportsLength = currentResult.Record.filter(
    (v) => v.type === RecordType.ARREST_REPORT,
  ).length;
  const writtenWarningsLength = currentResult.Record.filter(
    (v) => v.type === RecordType.WRITTEN_WARNING,
  ).length;
  const warrantsLength = currentResult.warrants.length;
  const notesLength = currentResult.notes?.length ?? 0;

  const TABS = [
    { value: "vehicles", name: `${t("Vehicles.registeredVehicles")} (${vehiclesLength})` },
    { value: "weapons", name: `${t("Weapons.registeredWeapons")} (${weaponsLength})` },
    { value: "tickets", name: `${t("Leo.tickets")} (${ticketsLength})` },
    { value: "arrestReports", name: `${t("Leo.arrestReports")} (${arrestReportsLength})` },
    { value: "writtenWarnings", name: `${t("Leo.writtenWarnings")} (${writtenWarningsLength})` },
    { value: "warrants", name: `${t("Leo.warrants")} (${warrantsLength})` },
    { value: "notes", name: `${t("Leo.notes")} (${notesLength})` },
  ];

  return (
    <TabList defaultValue="" tabs={TABS}>
      <NameSearchVehiclesTab />
      {WEAPON_REGISTRATION ? <NameSearchWeaponsTab /> : null}
      <RecordsTab
        setCurrentResult={setCurrentResult as any}
        currentResult={currentResult}
        records={currentResult.Record}
      />
      <NameSearchWarrantsTab />
      <NameSearchNotesTabs
        type="CITIZEN"
        currentResult={currentResult}
        setCurrentResult={setCurrentResult}
      />
    </TabList>
  );
}
