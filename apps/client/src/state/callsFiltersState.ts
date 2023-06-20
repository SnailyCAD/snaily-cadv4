import { create } from "zustand";
import type { Record, Citizen, MedicalRecord, RegisteredVehicle, Weapon } from "@snailycad/types";

export type CitizenWithVehAndWep = Citizen & {
  weapons: Weapon[];
  vehicles: RegisteredVehicle[];
  medicalRecords: MedicalRecord[];
  Record: Record[];
};

interface CallFiltersState {
  showFilters: boolean;
  setShowFilters(showFilters: boolean): void;

  search: string;
  setSearch(search: string): void;

  department: string | null;
  setDepartment(department: string | null): void;

  division: string | null;
  setDivision(division: string | null): void;

  assignedUnit: string | null;
  setAssignedUnit(assignedUnit: string | null): void;
}

export const useCallsFilters = create<CallFiltersState>()((set) => ({
  showFilters: false,
  setShowFilters: (showFilters) => set({ showFilters }),

  search: "",
  setSearch: (search) => set({ search }),

  assignedUnit: null,
  setAssignedUnit: (assignedUnit) => set({ assignedUnit }),

  department: null,
  setDepartment: (department) => set({ department }),

  division: null,
  setDivision: (division) => set({ division }),
}));
