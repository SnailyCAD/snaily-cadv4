import type { CombinedLeoUnit } from "@snailycad/types";
import create from "zustand";
import type { FullOfficer } from "./dispatchState";

export type ActiveOfficer = FullOfficer | CombinedLeoUnit;

interface LeoState {
  activeOfficer: ActiveOfficer | null;
  setActiveOfficer: (officer: ActiveOfficer | null) => void;

  officers: FullOfficer[];
  setOfficers: (officers: FullOfficer[]) => void;
}

export const useLeoState = create<LeoState>((set) => ({
  activeOfficer: null,
  setActiveOfficer: (officer) => set({ activeOfficer: officer }),

  officers: [],
  setOfficers: (officers) => set({ officers }),
}));
