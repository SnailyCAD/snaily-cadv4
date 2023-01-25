import * as React from "react";
import { getUnitDepartment, makeUnitName } from "lib/utils";
import { useTranslations } from "use-intl";
import { Loader, SelectField } from "@snailycad/ui";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { Table, useTableState } from "components/shared/Table";
import { TabsContent } from "components/shared/TabList";
import { useQuery } from "@tanstack/react-query";
import useFetch from "lib/useFetch";
import { FullDate } from "components/shared/FullDate";

export function DepartmentTimeLogsTab() {
  const [groupedBy, setGroupedBy] = React.useState<"departments" | "units">("departments");

  const { execute } = useFetch();

  const { data, isLoading } = useQuery({
    queryKey: [groupedBy],
    queryFn: async () => {
      const { json } = await execute({
        path: `/admin/manage/units/department-time-logs/${groupedBy}`,
      });

      if (Array.isArray(json)) {
        return json;
      }

      return [];
    },
  });

  const t = useTranslations();
  const { generateCallsign } = useGenerateCallsign();
  const tableState = useTableState();

  return (
    <TabsContent value="departmentTimeLogs">
      <SelectField
        className="max-w-xs"
        label={"Group By"}
        selectedKey={groupedBy}
        onSelectionChange={(event) => setGroupedBy(event as "departments" | "units")}
        options={[
          { label: "Departments", value: "departments" },
          { label: "Units", value: "units" },
        ]}
      />

      {isLoading || !data ? (
        <Loader />
      ) : data.length <= 0 ? (
        <p>{t("Management.noUnits")}</p>
      ) : (
        <Table
          tableState={tableState}
          data={data.map((unit) => {
            const hours = unit.hours < 1 ? "Less than 1" : unit.hours;

            const fields =
              groupedBy === "departments"
                ? { department: unit?.department.value.value }
                : {
                    unit: `${generateCallsign(unit.unit)} ${makeUnitName(unit.unit)}`,
                    department: getUnitDepartment(unit.unit)?.value.value,
                    firstSeen: <FullDate>{unit.firstSeen}</FullDate>,
                    lastSeen: <FullDate>{unit.lastSeen}</FullDate>,
                  };

            return {
              id: unit.departmentId || unit.unitId,
              ...fields,
              hours,
            };
          })}
          columns={[
            groupedBy === "units" ? { header: t("Leo.unit"), accessorKey: "unit" } : null,
            { header: t("Leo.department"), accessorKey: "department" },
            { header: t("Leo.hours"), accessorKey: "hours" },
            groupedBy === "units" ? { header: t("Leo.firstSeen"), accessorKey: "firstSeen" } : null,
            groupedBy === "units" ? { header: t("Leo.lastSeen"), accessorKey: "lastSeen" } : null,
          ]}
        />
      )}
    </TabsContent>
  );
}
