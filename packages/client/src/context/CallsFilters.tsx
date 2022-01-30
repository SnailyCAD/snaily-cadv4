import * as React from "react";
import type { FullRecord } from "components/leo/modals/NameSearchModal/RecordsArea";
import type { Citizen, MedicalRecord, RegisteredVehicle, Weapon } from "types/prisma";

export type CitizenWithVehAndWep = Citizen & {
  weapons: Weapon[];
  vehicles: RegisteredVehicle[];
  medicalRecords: MedicalRecord[];
  Record: FullRecord[];
};

interface Context {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;

  showFilters: boolean;
  setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
}

const CallsFiltersContext = React.createContext<Context | undefined>(undefined);

interface ProviderProps {
  children: React.ReactNode;
}

export function CallsFiltersProvider({ children }: ProviderProps) {
  const [showFilters, setShowFilters] = React.useState<boolean>(false);
  const [search, setSearch] = React.useState("");

  const value = { showFilters, setShowFilters, search, setSearch };

  return <CallsFiltersContext.Provider value={value}>{children}</CallsFiltersContext.Provider>;
}

export function useCallsFilters(): Context {
  const context = React.useContext(CallsFiltersContext);
  if (typeof context === "undefined") {
    throw new Error("`useCallsFilters` must be used within an `CallsFiltersProvider`");
  }

  return context;
}
