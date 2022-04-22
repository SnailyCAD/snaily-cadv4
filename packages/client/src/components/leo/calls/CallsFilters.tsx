import * as React from "react";
import type { Full911Call } from "state/dispatchState";
import { makeUnitName } from "lib/utils";
import { FormField } from "components/form/FormField";
import { useTranslations } from "next-intl";
import { Input } from "components/form/inputs/Input";
import { useCallsFilters } from "state/callsFiltersState";
import { Select, SelectValue } from "components/form/Select";

interface Props {
  calls: Full911Call[];
}

export function CallsFilters({ calls }: Props) {
  const {
    department,
    setDepartment,
    setDivision,
    division,
    search,
    setSearch,
    showFilters,
    setAssignedUnit,
    assignedUnit,
  } = useCallsFilters();

  const common = useTranslations("Common");
  const t = useTranslations("Calls");

  const departments = makeOptions(calls, "departments");
  const divisions = makeOptions(calls, "divisions");
  const assignedUnits = makeOptions(calls, "assignedUnits");

  React.useEffect(() => {
    if (!showFilters) {
      setDepartment(null);
      setDivision(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showFilters]);

  return showFilters ? (
    <div className="flex items-center gap-2 mt-2">
      <FormField className="w-full" label={common("search")}>
        <Input onChange={(e) => setSearch(e.target.value)} value={search} />
      </FormField>

      <FormField label={t("departments")}>
        <Select
          isClearable
          value={department?.value?.id ?? null}
          onChange={(e) => setDepartment(e.target)}
          className="w-56"
          values={departments}
        />
      </FormField>

      <FormField label={t("divisions")}>
        <Select
          isClearable
          value={division?.value?.id ?? null}
          onChange={(e) => setDivision(e.target)}
          className="w-56"
          values={divisions.filter((v) =>
            department?.value ? v.value.departmentId === department.value.id : true,
          )}
        />
      </FormField>

      <FormField label={t("assignedUnits")}>
        <Select
          isClearable
          value={assignedUnit?.value?.id ?? null}
          onChange={(e) => setAssignedUnit(e.target)}
          className="w-56"
          values={assignedUnits}
        />
      </FormField>
    </div>
  ) : null;
}

export type Call911Filters = "departments" | "divisions" | "assignedUnits";

function makeOptions(calls: Full911Call[], type: Call911Filters) {
  const arr: SelectValue<{ id: string; departmentId?: string | null }>[] = [];

  calls.forEach((call) => {
    const data = call[type];

    if (Array.isArray(data)) {
      data.forEach((v) => {
        const label = "value" in v ? v.value.value : makeUnitName(v.unit);
        const value = "value" in v ? v.id : v.id;

        const obj = {
          value: {
            id: value,
            departmentId: type === "divisions" && "departmentId" in v ? v.departmentId : undefined,
          },
          label,
        };

        const existing = arr.some((v) => v.value?.id === obj.value.id);
        if (!existing) {
          arr.push(obj);
        }
      });

      return;
    }

    if (data) {
      arr.push({ value: data, label: data });
    }
  });

  return arr;
}

export function useActiveCallsFilters() {
  const { department, division, assignedUnit } = useCallsFilters();

  const handleFilter = React.useCallback(
    (value: Full911Call) => {
      const isInDepartments = includesInArray(value.departments, department?.value?.id);
      const isInDivisions = includesInArray(value.divisions, division?.value?.id);
      const isInAssignedUnits = includesInArray(value.assignedUnits, assignedUnit?.value?.id);

      /**
       * show all calls if there is no filter
       */
      if (!department?.value && !division?.value && !assignedUnit?.value) return true;

      /**
       * department and division selected?
       *  -> only show calls with that department and division
       */
      if (department?.value && division?.value && assignedUnit?.value) {
        return isInDepartments && isInDivisions && isInAssignedUnits;
      }

      if (isInAssignedUnits) return true;
      if (isInDepartments) return true;
      if (isInDivisions) return true;

      return false;
    },
    [department?.value, division?.value, assignedUnit?.value],
  );

  return handleFilter;
}

// arr can be undefined since it may not be connected to the call data.
function includesInArray(arr: { id: string }[] | undefined, value: string | undefined) {
  return arr?.some((v) => v.id === value);
}
