import type { Officer, StatusValue, Value } from "types/prisma";
import create from "zustand";

export type ActiveOfficer = Officer & { department: Value<"DEPARTMENT">; status2: StatusValue };

interface LeoState {
  activeOfficer: ActiveOfficer | null;
  setActiveOfficer: (officer: ActiveOfficer | null) => void;

  officers: Officer[];
  setOfficers: (officers: Officer[]) => void;
}

export const useLeoState = create<LeoState>((set) => ({
  activeOfficer: null,
  setActiveOfficer: (officer) => set({ activeOfficer: officer }),

  officers: [],
  setOfficers: (officers) => set({ officers }),
}));
