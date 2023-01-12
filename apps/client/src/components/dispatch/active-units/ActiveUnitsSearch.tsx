import { TextField } from "@snailycad/ui";
import { useTranslations } from "next-intl";
import { useActiveUnitsState } from "state/active-unit-state";
import { shallow } from "zustand/shallow";

interface Props {
  type: "leo" | "ems-fd";
}

export function ActiveUnitsSearch({ type }: Props) {
  const setSearchType = type === "leo" ? "leoSearch" : "emsSearch";
  const showFiltersType: "showLeoFilters" | "showEmsFilters" =
    type === "leo" ? "showLeoFilters" : "showEmsFilters";

  const common = useTranslations("Common");
  const {
    [showFiltersType]: showFilters,
    [setSearchType]: search,
    setSearch,
  } = useActiveUnitsState(
    (state) => ({
      [showFiltersType]: state[showFiltersType],
      [setSearchType]: state[setSearchType],
      setSearch: state.setSearch,
    }),
    shallow,
  );

  return (showFilters as boolean) ? (
    <div className="px-4 mt-2 mb-5">
      <TextField
        label={common("search")}
        className="my-2"
        name="search"
        value={search as string}
        onChange={(value) => setSearch(setSearchType, value)}
      />
    </div>
  ) : null;
}
