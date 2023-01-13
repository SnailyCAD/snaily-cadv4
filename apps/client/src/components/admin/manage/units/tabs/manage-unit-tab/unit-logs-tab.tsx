import type {
  GetManageUnitByIdData,
  GetMyDeputiesLogsData,
  GetMyOfficersLogsData,
} from "@snailycad/types/api";
import { isUnitOfficer } from "@snailycad/utils";
import { OfficerLogsTable } from "components/leo/logs/OfficerLogsTable";
import { Infofield } from "components/shared/Infofield";
import { useAsyncTable } from "components/shared/Table";
import { TabsContent } from "components/shared/TabList";
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
      path: `${isUnitOfficer(unit) ? "/leo/logs" : "/ems-fd/logs"}?${extraPath}`,
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

        <div className="mt-3 mb-5 card shadow-md rounded-md px-4 p-2">
          <h4 className="mb-3 text-xl font-semibold">Statistics</h4>

          <Infofield label="Total Hours">108</Infofield>
          <Infofield label="Fist log">108</Infofield>
          <Infofield label="Latest log">108</Infofield>
        </div>

        <OfficerLogsTable unit={unit} asyncTable={asyncTable} />
      </div>
    </TabsContent>
  );
}
