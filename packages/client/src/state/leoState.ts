import type { Officer } from "types/prisma";
import create from "zustand";

interface LeoState {
  activeOfficer: Officer | null;
  setActiveOfficer: (officer: Officer | null) => void;

  officers: Officer[];
  setOfficers: (officers: Officer[]) => void;
}

export const useLeoState = create<LeoState>((set) => ({
  activeOfficer: null,
  setActiveOfficer: (officer) => set({ activeOfficer: officer }),

  officers: [],
  setOfficers: (officers) => set({ officers }),
}));
