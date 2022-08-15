import * as React from "react";
import type { Full911Call } from "state/dispatch/dispatchState";
import { makeUnitName } from "lib/utils";
import { FormField } from "components/form/FormField";
import { useTranslations } from "next-intl";
import { Input } from "components/form/inputs/Input";
import { useCallsFilters } from "state/callsFiltersState";
import { Select, SelectValue } from "components/form/Select";
import type { useAsyncTable } from "components/shared/Table";
import { Loader } from "components/Loader";

interface Props {
  calls: Full911Call[];
  search: ReturnType<typeof useAsyncTable>["search"];
}

export function CallsFilters({ search, calls }: Props) {
  const {
    department,
    setDepartment,
    setDivision,
    division,
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
      <FormField className="w-full relative" label={common("search")}>
        <Input onChange={(e) => search.setSearch(e.target.value)} value={search.search} />
        {search.state === "loading" ? (
          <span className="absolute top-[2.9rem] right-3 -translate-y-1/2">
            <Loader />
          </span>
        ) : null}
      </FormField>

      <FormField label={t("departments")}>
        <Select
          isClearable
          value={department?.value?.id ?? null}
          onChange={(e) => {
            setDepartment(e.target);
            search.setExtraParams({ department: e.target?.value?.id });
          }}
          className="w-56"
          values={departments}
        />
      </FormField>

      <FormField label={t("divisions")}>
        <Select
          isClearable
          value={division?.value?.id ?? null}
          onChange={(e) => {
            setDivision(e.target);
            search.setExtraParams({ division: e.target?.value?.id });
          }}
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
          className="w-56"
          onChange={(e) => {
            setAssignedUnit(e.target);
            search.setExtraParams({ assignedUnit: e.target?.value?.id });
          }}
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
