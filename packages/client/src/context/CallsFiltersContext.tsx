import * as React from "react";
import type { FullRecord } from "components/leo/modals/NameSearchModal/RecordsArea";
import type { Citizen, MedicalRecord, RegisteredVehicle, Weapon } from "@snailycad/types";
import type { SelectValue } from "components/form/Select";

export type CitizenWithVehAndWep = Citizen & {
  weapons: Weapon[];
  vehicles: RegisteredVehicle[];
  medicalRecords: MedicalRecord[];
  Record: FullRecord[];
};

type _SelectValue = SelectValue<{ id: string; departmentId?: string | null } | null>;

interface Context {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;

  showFilters: boolean;
  setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;

  department: _SelectValue | null;
  setDepartment: React.Dispatch<React.SetStateAction<_SelectValue | null>>;

  division: _SelectValue | null;
  setDivision: React.Dispatch<React.SetStateAction<_SelectValue | null>>;

  assignedUnit: _SelectValue | null;
  setAssignedUnit: React.Dispatch<React.SetStateAction<_SelectValue | null>>;
}

const CallsFiltersContext = React.createContext<Context | undefined>(undefined);

interface ProviderProps {
  children: React.ReactNode;
}

export function CallsFiltersProvider({ children }: ProviderProps) {
  const [showFilters, setShowFilters] = React.useState<boolean>(false);
  const [search, setSearch] = React.useState("");
  const [department, setDepartment] = React.useState<_SelectValue | null>(null);
  const [division, setDivision] = React.useState<_SelectValue | null>(null);
  const [assignedUnit, setAssignedUnit] = React.useState<_SelectValue | null>(null);

  const value = {
    showFilters,
    setShowFilters,
    search,
    setSearch,
    department,
    setDepartment,
    division,
    setDivision,
    assignedUnit,
    setAssignedUnit,
  };

  return <CallsFiltersContext.Provider value={value}>{children}</CallsFiltersContext.Provider>;
}

export function useCallsFilters(): Context {
  const context = React.useContext(CallsFiltersContext);
  if (typeof context === "undefined") {
    throw new Error("`useCallsFilters` must be used within an `CallsFiltersProvider`");
  }

  return context;
}
