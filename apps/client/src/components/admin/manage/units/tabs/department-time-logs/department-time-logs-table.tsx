import * as React from "react";
import { getUnitDepartment, makeUnitName } from "lib/utils";
import { useTranslations } from "use-intl";
import { DatePickerField, SelectField, TabsContent } from "@snailycad/ui";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import { FullDate } from "components/shared/FullDate";
import { useDebouncedValue } from "hooks/shared/use-debounced-value";
import { SearchArea } from "components/shared/search/search-area";
import type {
  GetDepartmentTimeLogsDepartmentsData,
  GetDepartmentTimeLogsUnitsData,
} from "@snailycad/types/api";

type DepartmentReturnType =
  | GetDepartmentTimeLogsUnitsData["logs"][number]
  | GetDepartmentTimeLogsDepartmentsData["logs"][number];

export function DepartmentTimeLogsTab() {
  const { value: search, localValue, setLocalValue } = useDebouncedValue("", 250);
  const [groupedBy, setGroupedBy] = React.useState<"departments" | "units">("departments");

  const asyncTable = useAsyncTable<DepartmentReturnType>({
    search,
    totalCount: 0,
    fetchOptions: {
      path: `/admin/manage/units/department-time-logs/${groupedBy}`,
      onResponse: (
        data: GetDepartmentTimeLogsDepartmentsData | GetDepartmentTimeLogsUnitsData,
      ) => ({
        data: data.logs,
        totalCount: data.totalCount,
      }),
    },
  });

  const t = useTranslations();
  const { generateCallsign } = useGenerateCallsign();
  const tableState = useTableState({ pagination: asyncTable.pagination });

  return (
    <TabsContent value="departmentTimeLogs">
      <SearchArea
        totalCount={asyncTable.pagination.totalDataCount}
        search={{ search: localValue, setSearch: setLocalValue }}
        asyncTable={asyncTable}
      >
        <SelectField
          className="max-w-xs w-full"
          label={t("Management.groupBy")}
          selectedKey={groupedBy}
          onSelectionChange={(event) => setGroupedBy(event as "departments" | "units")}
          options={[
            { label: t("Management.departments"), value: "departments" },
            { label: t("Management.units"), value: "units" },
          ]}
        />

        {groupedBy === "units" ? (
          <>
            <DatePickerField
              isClearable
              className="max-w-xs w-full"
              label={t("Management.startDate")}
              value={asyncTable.filters?.startDate}
              onChange={(date) => {
                asyncTable.setFilters((prev) => ({ ...prev, startDate: date?.toString() }));
              }}
            />
            <DatePickerField
              isClearable
              className="max-w-xs w-full"
              label={t("Management.endDate")}
              value={asyncTable.filters?.endDate}
              onChange={(date) => {
                asyncTable.setFilters((prev) => ({ ...prev, endDate: date?.toString() }));
              }}
            />
          </>
        ) : null}
      </SearchArea>

      {asyncTable.items.length <= 0 ? (
        <p>{t("Management.noUnits")}</p>
      ) : (
        <Table
          tableState={tableState}
          data={asyncTable.items.map((item) => {
            const hours = item.hours < 1 ? "Less than 1" : item.hours;
            const isGroupedByDepartments = "department" in item;
            const id = isGroupedByDepartments ? item.departmentId : item.unitId;

            const fields = isGroupedByDepartments
              ? { department: item?.department.value.value }
              : {
                  unit: `${generateCallsign(item.unit)} ${makeUnitName(item.unit)}`,
                  department: getUnitDepartment(item.unit)?.value.value,
                  firstSeen: <FullDate>{item.firstSeen}</FullDate>,
                  lastSeen: <FullDate>{item.lastSeen}</FullDate>,
                };

            return {
              id,
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
