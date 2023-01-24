import { create } from "zustand";
import type { Record, Citizen, MedicalRecord, RegisteredVehicle, Weapon } from "@snailycad/types";
import type { SelectValue } from "components/form/Select";

export type CitizenWithVehAndWep = Citizen & {
  weapons: Weapon[];
  vehicles: RegisteredVehicle[];
  medicalRecords: MedicalRecord[];
  Record: Record[];
};

type _SelectValue = SelectValue<{ id: string; departmentId?: string | null } | null>;

interface CallFiltersState {
  showFilters: boolean;
  setShowFilters(showFilters: boolean): void;

  search: string;
  setSearch(search: string): void;

  department: _SelectValue | null;
  setDepartment(department: _SelectValue | null): void;

  division: _SelectValue | null;
  setDivision(division: _SelectValue | null): void;

  assignedUnit: _SelectValue | null;
  setAssignedUnit(assignedUnit: _SelectValue | null): void;
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
