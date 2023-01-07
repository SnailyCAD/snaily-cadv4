import { Loader, SelectField, TextField } from "@snailycad/ui";
import { Bolo, BoloType } from "@snailycad/types";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { useTranslations } from "next-intl";
import { makeUnitName } from "lib/utils";
import type { useAsyncTable } from "components/shared/Table";

interface Props {
  asyncTable: ReturnType<typeof useAsyncTable>;
  search: { search: string; setSearch(value: string): void };
}

const BOLO_TYPES = Object.keys(BoloType).map((type) => ({
  label: type.toLowerCase(),
  value: type,
}));

export function BoloFilters({ asyncTable, search }: Props) {
  const common = useTranslations("Common");

  return (
    <div className="mt-3 px-4 items-end grid grid-cols-1 md:grid-cols-4 gap-3">
      <div className="flex items-baseline gap-2 md:col-span-3">
        <TextField
          label={common("search")}
          className="w-full relative "
          name="search"
          onChange={search.setSearch}
          value={search.search}
        >
          {asyncTable.isLoading ? (
            <span className="absolute top-[2.4rem] right-2.5">
              <Loader />
            </span>
          ) : null}
        </TextField>
      </div>

      <SelectField
        isClearable
        onSelectionChange={(type) => asyncTable.setFilters((prev) => ({ ...prev, type }))}
        selectedKey={asyncTable.filters?.type}
        options={BOLO_TYPES}
        label={"Bolo Type"}
      />
    </div>
  );
}

export function useBOLOFilters() {
  const { generateCallsign } = useGenerateCallsign();
  const t = useTranslations("Leo");

  function handleFilter(bolo: Bolo, search: string) {
    if (!search) return true;

    const officer = bolo.officer
      ? `${generateCallsign(bolo.officer)} ${makeUnitName(bolo.officer)}`
      : t("dispatch");

    const text = `${bolo.color} ${bolo.description} ${bolo.model} ${bolo.name} ${officer} ${bolo.plate} ${bolo.type}`;
    return text.toLowerCase().includes(search);
  }

  return handleFilter;
}
