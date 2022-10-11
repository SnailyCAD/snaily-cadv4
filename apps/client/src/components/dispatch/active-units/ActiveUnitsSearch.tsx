import { TextField } from "@snailycad/ui";
import { useTranslations } from "next-intl";
import { useActiveUnitsState } from "state/activeUnitsState";

interface Props {
  type: "leo" | "ems-fd";
}

export function ActiveUnitsSearch({ type }: Props) {
  const setSearchType = type === "leo" ? "leoSearch" : "emsSearch";
  const showFiltersType = type === "leo" ? "showLeoFilters" : "showEmsFilters";

  const common = useTranslations("Common");
  const {
    [showFiltersType]: showFilters,
    [setSearchType]: search,
    setSearch,
  } = useActiveUnitsState();

  return showFilters ? (
    <div className="px-4 mt-2 mb-5">
      <TextField
        label={common("search")}
        className="my-2"
        name="search"
        value={search}
        onChange={(value) => setSearch(setSearchType, value)}
      />
    </div>
  ) : null;
}
