import type {
  Citizen,
  RegisteredVehicle,
  ValueType,
  Value,
  TruckLog,
  Business,
} from "@snailycad/types";
import create from "zustand";

export interface VehicleSearchResult extends RegisteredVehicle {
  citizen: Citizen;
  registrationStatus: Value<ValueType.LICENSE>;
  TruckLog: TruckLog[];
  Business: Business[];
}

interface VehicleSearchState {
  currentResult: VehicleSearchResult | null | undefined;
  setCurrentResult(v: VehicleSearchResult | null | undefined): void;
}

export const useVehicleSearch = create<VehicleSearchState>((set) => ({
  currentResult: undefined,
  setCurrentResult: (v) => set({ currentResult: v }),
}));
