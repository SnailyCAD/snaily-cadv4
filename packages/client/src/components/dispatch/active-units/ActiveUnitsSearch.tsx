import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { useTranslations } from "next-intl";
import { useActiveUnitsState } from "state/activeUnitsState";

interface Props {
  type: "leo" | "ems-fd";
  search?: { search: string; setSearch: React.Dispatch<React.SetStateAction<string>> };
}

export function ActiveUnitsSearch({ type, search: apiSearch }: Props) {
  const filterType = type === "leo" ? "showLeoFilters" : "showEmsFilters";
  const common = useTranslations("Common");
  const { emsSearch, [filterType]: showFilter, setSearch: _setSearch } = useActiveUnitsState();

  const search = apiSearch?.search ?? emsSearch;
  const setSearch = apiSearch?.setSearch ?? _setSearch;

  return showFilter ? (
    <div className="px-4 mt-2 mb-5">
      <FormField className="w-full" label={common("search")}>
        <Input onChange={(e) => setSearch(e.target.value, "emsSearch")} value={search} />
      </FormField>
    </div>
  ) : null;
}
