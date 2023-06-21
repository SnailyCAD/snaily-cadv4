import type { PostLeoSearchVehicleData } from "@snailycad/types/api";
import { create } from "zustand";

export type VehicleSearchResult = NonNullable<PostLeoSearchVehicleData>;

interface VehicleSearchState {
  currentResult: VehicleSearchResult | null | "initial";
  setCurrentResult(v: VehicleSearchResult | null | "initial"): void;
}

export const useVehicleSearch = create<VehicleSearchState>()((set) => ({
  currentResult: "initial",
  setCurrentResult: (v) => set({ currentResult: v }),
}));
