import * as React from "react";
import Link from "next/link";
import { formatOfficerDepartment, makeUnitName } from "lib/utils";
import { useTranslations } from "use-intl";
import { buttonVariants } from "@snailycad/ui";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import { TabsContent } from "components/shared/TabList";
import { Permissions, usePermission } from "hooks/usePermission";
import type { GetManageUnitsData } from "@snailycad/types/api";
import { SearchArea } from "components/shared/search/search-area";
import { FormField } from "components/form/FormField";
import { Select } from "components/form/Select";
import { useValues } from "context/ValuesContext";

interface Props {
  units: GetManageUnitsData;
}

export function DepartmentTimeLogsTab({ units }: Props) {
  const [search, setSearch] = React.useState("");

  const asyncTable = useAsyncTable({
    search,
    totalCount: units.totalCount,
    initialData: units.units,
    fetchOptions: {
      path: "/admin/manage/units",
      onResponse: (data: GetManageUnitsData) => ({
        data: data.units,
        totalCount: data.totalCount,
      }),
    },
  });

  const { hasPermissions } = usePermission();
  const t = useTranslations();
  const common = useTranslations("Common");
  const { generateCallsign } = useGenerateCallsign();
  const tableState = useTableState({ search: { value: search } });
  const hasViewUsersPermissions = hasPermissions([Permissions.ViewUsers], true);
  const { department } = useValues();

  const LABELS = {
    DEPUTY: t("Ems.deputy"),
    OFFICER: t("Leo.officer"),
  };

  return (
    <TabsContent value="departmentTimeLogs">
      <SearchArea
        search={{ search, setSearch }}
        asyncTable={asyncTable}
        totalCount={units.totalCount}
      >
        <FormField className="w-full max-w-[15rem]" label={t("Leo.department")}>
          <Select
            isClearable
            value={asyncTable.filters?.departmentId ?? null}
            onChange={(event) =>
              asyncTable.setFilters((prev) => ({ ...prev, departmentId: event.target.value }))
            }
            values={department.values.map((v) => ({
              label: v.value.value,
              value: v.id,
            }))}
          />
        </FormField>
      </SearchArea>

      {asyncTable.items.length <= 0 ? (
        <p>{t("Management.noUnits")}</p>
      ) : (
        <Table
          tableState={tableState}
          data={asyncTable.items.map((unit) => {
            return {
              id: unit.id,
              unit: LABELS[unit.type],
              name: makeUnitName(unit),
              user:
                hasViewUsersPermissions && unit.user ? (
                  <Link
                    href={`/admin/manage/users/${unit.userId}`}
                    className={`rounded-md transition-all p-1 px-1.5 ${buttonVariants.default}`}
                  >
                    {unit.user.username}
                  </Link>
                ) : (
                  unit.user?.username ?? t("Leo.temporaryUnit")
                ),
              callsign1: unit.callsign,
              callsign2: unit.callsign2,
              callsign: generateCallsign(unit),
              department: formatOfficerDepartment(unit) ?? common("none"),
            };
          })}
          columns={[
            { header: `${t("Ems.deputy")}/${t("Leo.officer")}`, accessorKey: "unit" },
            { header: common("name"), accessorKey: "name" },
            { header: t("Leo.callsign1"), accessorKey: "callsign1" },
            { header: t("Leo.callsign2"), accessorKey: "callsign2" },
            { header: t("Leo.callsign"), accessorKey: "callsign" },
            { header: t("Leo.department"), accessorKey: "department" },
            { header: common("user"), accessorKey: "user" },
          ]}
        />
      )}
    </TabsContent>
  );
}
