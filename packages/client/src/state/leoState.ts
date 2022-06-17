import type { CombinedLeoUnit, Officer } from "@snailycad/types";
import create from "zustand";

export type ActiveOfficer = Officer | CombinedLeoUnit;

interface LeoState {
  activeOfficer: ActiveOfficer | null;
  setActiveOfficer(officer: ActiveOfficer | null): void;

  userOfficers: Officer[];
  setUserOfficers(userOfficers: Officer[]): void;
}

export const useLeoState = create<LeoState>((set) => ({
  activeOfficer: null,
  setActiveOfficer: (officer) => set({ activeOfficer: officer }),

  userOfficers: [],
  setUserOfficers: (userOfficers) => set({ userOfficers }),
}));
