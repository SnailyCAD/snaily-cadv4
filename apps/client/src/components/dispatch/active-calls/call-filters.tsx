import * as React from "react";
import type { Full911Call } from "state/dispatch/dispatch-state";
import { makeUnitName } from "lib/utils";
import { FormField } from "components/form/FormField";
import { useTranslations } from "next-intl";
import { Loader, TextField } from "@snailycad/ui";
import { useCallsFilters } from "state/callsFiltersState";
import { Select, SelectValue } from "components/form/Select";
import type { useAsyncTable } from "components/shared/Table";
import { useValues } from "context/ValuesContext";
import type { DepartmentValue, DivisionValue } from "@snailycad/types";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";

interface Props {
  calls: Full911Call[];
  asyncTable: ReturnType<typeof useAsyncTable<Full911Call>>;
}

export function CallsFilters({ asyncTable, calls }: Props) {
  const {
    department,
    setDepartment,
    setDivision,
    division,
    showFilters,
    setAssignedUnit,
    assignedUnit,
    search,
    setSearch,
  } = useCallsFilters();

  const common = useTranslations("Common");
  const t = useTranslations("Calls");
  const { generateCallsign } = useGenerateCallsign();

  const values = useValues();
  const departments = makeOptions(values.department.values);
  const divisions = makeOptions(values.division.values);
  const assignedUnits = makeAssignedUnitOptions(calls, generateCallsign);
  const { DIVISIONS } = useFeatureEnabled();

  React.useEffect(() => {
    if (!showFilters) {
      setDepartment(null);
      setDivision(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFilters]);

  return showFilters ? (
    <div className="flex items-center gap-2 mt-2">
      <TextField
        label={common("search")}
        className="w-full relative"
        name="search"
        onChange={setSearch}
        value={search}
        placeholder="#, Name, Location, ..."
      >
        {asyncTable.isLoading ? (
          <span className="absolute top-[2.4rem] right-2.5">
            <Loader />
          </span>
        ) : null}
      </TextField>

      <FormField label={t("departments")}>
        <Select
          isClearable
          value={department?.value?.id ?? null}
          onChange={(e) => {
            setDepartment(e.target);

            asyncTable.setFilters((prev) => ({
              ...prev,
              department: e.target?.value?.id ?? null,
            }));
          }}
          className="w-56"
          values={departments}
        />
      </FormField>

      {DIVISIONS ? (
        <FormField label={t("divisions")}>
          <Select
            isClearable
            value={division?.value?.id ?? null}
            onChange={(e) => {
              setDivision(e.target);
              asyncTable.setFilters((prev) => ({
                ...prev,
                division: e.target?.value?.id ?? null,
              }));
            }}
            className="w-56"
            values={divisions.filter((v) =>
              department?.value ? v.value.departmentId === department.value.id : true,
            )}
          />
        </FormField>
      ) : null}

      <FormField label={t("assignedUnits")}>
        <Select
          isClearable
          value={assignedUnit?.value?.id ?? null}
          className="w-56"
          onChange={(e) => {
            setAssignedUnit(e.target);

            asyncTable.setFilters((prev) => ({
              ...prev,
              assignedUnit: e.target?.value?.id ?? null,
            }));
          }}
          values={assignedUnits}
        />
      </FormField>
    </div>
  ) : null;
}

export type Call911Filters = "departments" | "divisions" | "assignedUnits";

function makeOptions<T extends DepartmentValue | DivisionValue>(values: T[]) {
  return values.map((v) => ({
    value: v,
    label: v.value.value,
  }));
}

function makeAssignedUnitOptions(calls: Full911Call[], generateCallsign: (unit: any) => string) {
  const map = new Map<string, SelectValue<{ id: string }>>();

  calls.forEach((call) => {
    const data = call.assignedUnits;

    if (Array.isArray(data)) {
      data.forEach((v) => {
        const label = `${generateCallsign(v.unit)} ${makeUnitName(v.unit)}`;
        const value = v.unit?.id ?? v.id;

        const obj: SelectValue<{ id: string }> = {
          value: { id: value },
          label,
        };

        if (!map.has(value)) {
          map.set(value, obj);
        }
      });
    }
  });

  return Array.from(map.values());
}
