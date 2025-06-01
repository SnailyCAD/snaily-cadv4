import * as React from "react";
import type { Full911Call } from "state/dispatch/dispatch-state";
import { makeUnitName } from "lib/utils";
import { useTranslations } from "next-intl";
import { Loader, SelectField, type SelectValue, TextField } from "@snailycad/ui";
import { useCallsFilters } from "state/callsFiltersState";
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

      <SelectField
        label={t("departments")}
        isClearable
        isOptional
        options={departments}
        selectedKey={department ?? null}
        className="w-96"
        onSelectionChange={(key) => {
          const stringifiedKey = key as unknown as string | null;

          setDepartment(stringifiedKey);
          asyncTable.setFilters((prev) => ({
            ...prev,
            department: stringifiedKey ?? null,
          }));
        }}
      />

      {DIVISIONS ? (
        <SelectField
          label={t("divisions")}
          isClearable
          isOptional
          options={divisions}
          selectedKey={division ?? null}
          className="w-96"
          onSelectionChange={(key) => {
            const stringifiedKey = key as unknown as string | null;

            setDivision(stringifiedKey);
            asyncTable.setFilters((prev) => ({
              ...prev,
              division: stringifiedKey ?? null,
            }));
          }}
        />
      ) : null}

      <SelectField
        label={t("assignedUnits")}
        isClearable
        isOptional
        options={assignedUnits}
        selectedKey={assignedUnit ?? null}
        className="w-96"
        onSelectionChange={(key) => {
          const stringifiedKey = key as unknown as string | null;

          setAssignedUnit(stringifiedKey);
          asyncTable.setFilters((prev) => ({
            ...prev,
            assignedUnit: stringifiedKey ?? null,
          }));
        }}
      />
    </div>
  ) : null;
}

export type Call911Filters = "departments" | "divisions" | "assignedUnits";

function makeOptions<T extends DepartmentValue | DivisionValue>(values: T[]) {
  return values.map((v) => ({
    value: v.id,
    label: v.value.value,
  }));
}

function makeAssignedUnitOptions(calls: Full911Call[], generateCallsign: (unit: any) => string) {
  const map = new Map<string, SelectValue>();

  calls.forEach((call) => {
    const data = call.assignedUnits;

    if (Array.isArray(data)) {
      data.forEach((v) => {
        const label = `${generateCallsign(v.unit)} ${makeUnitName(v.unit)}`;
        const value = v.unit?.id ?? v.id;

        const obj = {
          value,
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
