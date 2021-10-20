import { OfficerWithDept } from "src/pages/officer/my-officers";
import type { Bolo, Call911, Officer, StatusValue } from "types/prisma";
import create from "zustand";

export type Full911Call = Call911 & { assignedUnits: Officer[] };
export type FullBolo = Bolo & { officer: Officer };
export type FullOfficer = OfficerWithDept & { status2: StatusValue };

interface DispatchState {
  calls: Full911Call[];
  setCalls: (calls: Full911Call[]) => void;

  bolos: FullBolo[];
  setBolos: (bolos: FullBolo[]) => void;

  activeOfficers: FullOfficer[];
  setActiveOfficers: (officers: FullOfficer[]) => void;
}

export const useDispatchState = create<DispatchState>((set) => ({
  calls: [],
  setCalls: (calls) => set({ calls }),

  bolos: [],
  setBolos: (bolos) => set({ bolos }),

  activeOfficers: [],
  setActiveOfficers: (officers) => set({ activeOfficers: officers }),
}));
