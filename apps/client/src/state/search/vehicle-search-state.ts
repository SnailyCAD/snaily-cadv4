import type { PostLeoSearchVehicleData } from "@snailycad/types/api";
import { createWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/shallow";

export type VehicleSearchResult = NonNullable<PostLeoSearchVehicleData>;

interface VehicleSearchState {
  currentResult: VehicleSearchResult | null | "initial";
  setCurrentResult(v: VehicleSearchResult | null | "initial"): void;
}

export const useVehicleSearch = createWithEqualityFn<VehicleSearchState>()(
  (set) => ({
    currentResult: "initial",
    setCurrentResult: (v) => set({ currentResult: v }),
  }),
  shallow,
);
