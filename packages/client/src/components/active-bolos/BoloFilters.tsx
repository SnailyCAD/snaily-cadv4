import * as React from "react";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import type { Bolo } from "@snailycad/types";

interface Props {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
}

export function BoloFilters({ search, setSearch }: Props) {
  return (
    <div className="py-2 pt-5">
      <FormField label="Search">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} />
      </FormField>
    </div>
  );
}

export function handleFilter(bolo: Bolo, search: string) {
  if (!search) return true;

  const text = `${bolo.color} ${bolo.description} ${bolo.model} ${bolo.name} ${bolo.officer} ${bolo.plate} ${bolo.type}`;
  return text.toLowerCase().includes(search);
}
