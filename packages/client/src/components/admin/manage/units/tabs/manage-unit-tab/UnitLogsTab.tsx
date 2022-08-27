import type { GetManageUnitByIdData } from "@snailycad/types/api";
import { OfficerLogsTable } from "components/leo/logs/OfficerLogsTable";
import { TabsContent } from "components/shared/TabList";
import { useTranslations } from "next-intl";

interface Props {
  unit: GetManageUnitByIdData;
}

export function UnitLogsTab({ unit }: Props) {
  const t = useTranslations("Leo");

  return (
    <TabsContent value="unit-logs">
      <div className="mt-3">
        <h1 className="text-xl font-semibold">{t("officerLogs")}</h1>

        <OfficerLogsTable unit={unit} logs={unit.logs} />
      </div>
    </TabsContent>
  );
}
