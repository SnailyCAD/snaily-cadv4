import type { Full911Call } from "state/dispatchState";
import { makeUnitName } from "lib/utils";
import { FormField } from "components/form/FormField";
import { useTranslations } from "next-intl";
import { Input } from "components/form/inputs/Input";
import { useCallsFilters } from "context/CallsFilters";
import { Select } from "components/form/Select";

interface Props {
  calls: Full911Call[];
}

export function CallsFilters({ calls }: Props) {
  const { search, setSearch, showFilters } = useCallsFilters();

  const common = useTranslations("Common");
  const t = useTranslations("Calls");

  const names = makeOptions(calls, "name");
  const departments = makeOptions(calls, "departments");
  const divisions = makeOptions(calls, "divisions");
  const assignedUnits = makeOptions(calls, "assignedUnits");

  return showFilters ? (
    <div className="flex items-center gap-2">
      <FormField className="w-full" label={common("search")}>
        <Input onChange={(e) => setSearch(e.target.value)} value={search} />
      </FormField>

      <FormField label={t("departments")}>
        <Select className="w-56" values={departments} />
      </FormField>

      <FormField label={t("divisions")}>
        <Select className="w-56" values={divisions} />
      </FormField>
    </div>
  ) : null;
}

export type Call911Filters =
  | "departments"
  | "divisions"
  | "location"
  | "postal"
  | "name"
  | "assignedUnits";

function makeOptions(calls: Full911Call[], type: Call911Filters) {
  const arr: {
    value: string;
    label: string;
  }[] = [];

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
