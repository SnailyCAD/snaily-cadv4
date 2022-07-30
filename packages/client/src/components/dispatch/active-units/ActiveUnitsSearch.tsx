import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { useTranslations } from "next-intl";
import { useActiveUnitsState } from "state/activeUnitsState";

interface Props {
  type: "leo" | "ems-fd";
  search: { search: string; setSearch: React.Dispatch<React.SetStateAction<string>> };
}

export function ActiveUnitsSearch({ type, search }: Props) {
  const showFiltersType = type === "leo" ? "showLeoFilters" : "showEmsFilters";

  const common = useTranslations("Common");
  const { [showFiltersType]: showFilters } = useActiveUnitsState();

  return showFilters ? (
    <div className="px-4 mt-2 mb-5">
      <FormField className="w-full" label={common("search")}>
        <Input onChange={(e) => search.setSearch(e.target.value)} value={search.search} />
      </FormField>
    </div>
  ) : null;
}
