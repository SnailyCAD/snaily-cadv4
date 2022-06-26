import type {
  Citizen,
  RegisteredVehicle,
  Value,
  TruckLog,
  Business,
  CustomField,
  CustomFieldValue,
} from "@snailycad/types";
import create from "zustand";

export interface VehicleSearchResult extends RegisteredVehicle {
  citizen: Citizen;
  registrationStatus: Value;
  TruckLog: TruckLog[];
  Business: Business[];
  allCustomFields?: CustomField[];
  customFields?: CustomFieldValue[];
}

interface VehicleSearchState {
  currentResult: VehicleSearchResult | null | undefined;
  setCurrentResult(v: VehicleSearchResult | null | undefined): void;
}

export const useVehicleSearch = create<VehicleSearchState>((set) => ({
  currentResult: undefined,
  setCurrentResult: (v) => set({ currentResult: v }),
}));
