import type {
  GetManageUnitByIdData,
  GetMyDeputiesLogsData,
  GetMyOfficersLogsData,
} from "@snailycad/types/api";
import { isUnitOfficer } from "@snailycad/utils";
import { OfficerLogsTable } from "components/leo/logs/OfficerLogsTable";
import { useAsyncTable } from "components/shared/Table";
import { TabsContent } from "@snailycad/ui";
import { useTranslations } from "next-intl";

interface Props {
  unit: GetManageUnitByIdData;
}

export function UnitLogsTab({ unit }: Props) {
  const t = useTranslations("Leo");

  const extraPath = isUnitOfficer(unit) ? `officerId=${unit.id}` : `emsFdDeputyId=${unit.id}`;

  const asyncTable = useAsyncTable({
    initialData: unit.logs,
    totalCount: unit.logs.length,
    fetchOptions: {
      pageSize: 25,
      path: `${isUnitOfficer(unit) ? "/leo/logs" : "/ems-fd/logs"}?${extraPath}&isAdmin=true`,
      onResponse: (json: GetMyDeputiesLogsData | GetMyOfficersLogsData) => ({
        totalCount: json.totalCount,
        data: json.logs,
      }),
    },
  });

  return (
    <TabsContent value="unit-logs">
      <div className="mt-3">
        <h1 className="text-xl font-semibold">{t("officerLogs")}</h1>

        <OfficerLogsTable unit={unit} asyncTable={asyncTable} />
      </div>
    </TabsContent>
  );
}
