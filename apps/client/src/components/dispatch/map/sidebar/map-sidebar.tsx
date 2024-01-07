import { TabList, TabsContent } from "@snailycad/ui";
import { useTranslations } from "use-intl";
import { ActiveMapCalls } from "../calls/active-map-calls";
import { ActiveMapUnits } from "../units/active-map-units";

export function MapSidebar() {
  const t = useTranslations();

  const tabs = [
    { value: "active-calls", name: t("Calls.active911Calls") },
    {
      value: "active-units",
      name: t("Leo.activeUnits"),
    },
  ];

  return (
    <aside className="col-span-1 p-3">
      <TabList tabs={tabs}>
        <TabsContent value="active-calls">
          <ActiveMapCalls />
        </TabsContent>
        <TabsContent value="active-units">
          <ActiveMapUnits />
        </TabsContent>
      </TabList>
    </aside>
  );
}
