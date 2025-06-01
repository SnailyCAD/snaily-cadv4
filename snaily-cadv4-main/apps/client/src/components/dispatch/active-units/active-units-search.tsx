import * as Tooltip from "@radix-ui/react-tooltip";
import { Loader, TextField } from "@snailycad/ui";
import { useTranslations } from "next-intl";
import { InfoCircleFill } from "react-bootstrap-icons";
import { useActiveUnitsState } from "state/active-unit-state";

interface Props {
  type: "leo" | "ems-fd";
  isLoading: boolean;
  totalCount: number;
}

export function ActiveUnitsSearch({ totalCount, isLoading, type }: Props) {
  const t = useTranslations("Leo");
  const setSearchType = type === "leo" ? "leoSearch" : "emsSearch";
  const showFiltersType: "showLeoFilters" | "showEmsFilters" =
    type === "leo" ? "showLeoFilters" : "showEmsFilters";

  const common = useTranslations("Common");
  const {
    [showFiltersType]: showFilters,
    [setSearchType]: search,
    setSearch,
  } = useActiveUnitsState((state) => ({
    [showFiltersType]: state[showFiltersType],
    [setSearchType]: state[setSearchType],
    setSearch: state.setSearch,
  }));

  return (
    <div className="px-4 mt-2">
      {totalCount > 0 ? (
        <Tooltip.Provider delayDuration={0}>
          <Tooltip.Root>
            <Tooltip.Trigger>
              <p className="text-neutral-700 dark:text-gray-400 flex items-center gap-2 mt-1">
                <InfoCircleFill />
                {t("showingOnlyLatest12Units")}
              </p>
            </Tooltip.Trigger>

            <Tooltip.Content
              align="start"
              className="bg-gray-200 dark:border dark:border-secondary dark:bg-tertiary shadow-lg w-full max-w-lg p-3 rounded-md dark:text-white hover-card animate-enter z-50"
            >
              <p className="text-neutral-800 dark:text-gray-300 mb-0 font-medium">
                {t("showingOnlyLatest12UnitsDescription")}
              </p>
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>
      ) : null}

      {(showFilters as boolean) ? (
        <TextField
          label={common("search")}
          className="w-full relative mt-3 mb-1"
          name="search"
          value={search as string}
          onChange={(value) => setSearch(setSearchType, value)}
          placeholder="Name, Badge Number, Status, ..."
        >
          {isLoading ? (
            <span className="absolute top-[2.4rem] right-2.5">
              <Loader />
            </span>
          ) : null}
        </TextField>
      ) : null}
    </div>
  );
}
