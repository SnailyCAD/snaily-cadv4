import { TabList, TabsContent } from "@snailycad/ui";
import { useTranslations } from "use-intl";
import { ActiveMapCalls } from "../calls/active-map-calls";
import { ActiveMapUnits } from "../units/active-map-units";
import { MapActions } from "../map-actions";
import { Manage911CallModal } from "components/dispatch/active-calls/modals/manage-911-call-modal";
import { useCall911State } from "state/dispatch/call-911-state";

export function MapSidebar() {
  const t = useTranslations();
  const calls911State = useCall911State((state) => ({
    currentlySelectedCall: state.currentlySelectedCall,
    setCurrentlySelectedCall: state.setCurrentlySelectedCall,
  }));

  const tabs = [
    { value: "active-calls", name: t("Calls.active911Calls") },
    { value: "active-units", name: t("Leo.activeUnits") },
  ];

  return (
    <aside className="col-span-1 p-3">
      <MapActions />
      <TabList queryState={false} tabs={tabs}>
        <TabsContent value="active-calls">
          <ActiveMapCalls />
        </TabsContent>
        <TabsContent value="active-units">
          <ActiveMapUnits />
        </TabsContent>
      </TabList>

      <Manage911CallModal
        onClose={() => calls911State.setCurrentlySelectedCall(null)}
        call={calls911State.currentlySelectedCall}
      />
    </aside>
  );
}
