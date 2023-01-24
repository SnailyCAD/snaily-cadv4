import type { PostLeoSearchVehicleData } from "@snailycad/types/api";
import { create } from "zustand";

export type VehicleSearchResult = NonNullable<PostLeoSearchVehicleData>;

interface VehicleSearchState {
  currentResult: VehicleSearchResult | null | undefined;
  setCurrentResult(v: VehicleSearchResult | null | undefined): void;
}

export const useVehicleSearch = create<VehicleSearchState>()((set) => ({
  currentResult: undefined,
  setCurrentResult: (v) => set({ currentResult: v }),
}));
