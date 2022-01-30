import * as React from "react";
import type { Full911Call } from "state/dispatchState";
import { makeUnitName } from "lib/utils";
import { FormField } from "components/form/FormField";
import { useTranslations } from "next-intl";
import { Input } from "components/form/inputs/Input";
import { useCallsFilters } from "context/CallsFilters";
import { Select, SelectValue } from "components/form/Select";

interface Props {
  calls: Full911Call[];
}

export function CallsFilters({ calls }: Props) {
  const { department, setDepartment, setDivision, division, search, setSearch, showFilters } =
    useCallsFilters();

  const common = useTranslations("Common");
  const t = useTranslations("Calls");

  const departments = makeOptions(calls, "departments");
  const divisions = makeOptions(calls, "divisions");

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
          value={department?.value ?? null}
          onChange={(e) => setDepartment(e.target)}
          className="w-56"
          values={departments}
        />
      </FormField>

      <FormField label={t("divisions")}>
        <Select
          isClearable
          value={division?.value ?? null}
          onChange={(e) => setDivision(e.target)}
          className="w-56"
          values={divisions}
        />
      </FormField>
    </div>
  ) : null;
}

export type Call911Filters = "departments" | "divisions" | "assignedUnits";

function makeOptions(calls: Full911Call[], type: Call911Filters) {
  const arr: SelectValue[] = [];

  calls.forEach((call) => {
    const data = call[type];

    if (Array.isArray(data)) {
      data.forEach((v) => {
        const label = "value" in v ? v.value.value : makeUnitName(v.unit);
        const value = "value" in v ? v.id : v.unit.id;

        const obj = {
          value,
          label,
        };

        const existing = arr.some((v) => v.value === obj.value);
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

  return [...new Set(arr.flat(1))];
}

export function useActiveCallsFilters() {
  const { department, division } = useCallsFilters();

  const handleFilter = React.useCallback(
    (value: Full911Call) => {
      const isInDepartments = includesInArray(value.departments, department?.value);
      const isInDivisions = includesInArray(value.divisions, division?.value);

      /**
       * show all calls if there is no filter
       */
      if (!department?.value && !division?.value) return true;

      /**
       * department and division selected?
       *  -> only show calls with that department and division
       */
      if (department?.value && division?.value) {
        return isInDepartments && isInDivisions;
      }

      if (isInDepartments) return true;
      if (isInDivisions) return true;

      return false;
    },
    [department?.value, division?.value],
  );

  return handleFilter;
}

function includesInArray(arr: { id: string }[], value: string | undefined) {
  // if (!value) return true;
  return arr.some((v) => v.id === value);
}
