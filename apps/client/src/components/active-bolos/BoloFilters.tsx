import * as React from "react";
import { TextField } from "@snailycad/ui";
import type { Bolo } from "@snailycad/types";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { useTranslations } from "next-intl";
import { makeUnitName } from "lib/utils";

interface Props {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
}

export function BoloFilters({ search, setSearch }: Props) {
  return (
    <div className="py-2 pt-5">
      <TextField
        label="Search"
        name="search"
        value={search}
        onChange={(value) => setSearch(value)}
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
