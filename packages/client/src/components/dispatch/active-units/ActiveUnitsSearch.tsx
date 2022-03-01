import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { useTranslations } from "next-intl";
import { useActiveUnitsState } from "state/activeUnitsState";

interface Props {
  type: "leo" | "ems-fd";
}

export function ActiveUnitsSearch({ type }: Props) {
  const setSearchType = type === "leo" ? "leoSearch" : "emsSearch";
  const common = useTranslations("Common");
  const { showFilters, setSearch, [setSearchType]: search } = useActiveUnitsState();

  return showFilters ? (
    <div className="px-4 mt-2 mb-5">
      <FormField className="w-full" label={common("search")}>
        <Input onChange={(e) => setSearch(setSearchType, e.target.value)} value={search} />
      </FormField>
    </div>
  ) : null;
}
