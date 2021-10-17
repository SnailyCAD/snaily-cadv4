import type { Bolo, Call911, Officer } from "types/prisma";
import create from "zustand";

export type Full911Call = Call911 & { assignedUnits: Officer[] };
export type FullBolo = Bolo & { officer: Officer };

interface DispatchState {
  calls: Full911Call[];
  setCalls: (calls: Full911Call[]) => void;

  bolos: FullBolo[];
  setBolos: (bolos: FullBolo[]) => void;
}

export const useDispatchState = create<DispatchState>((set) => ({
  calls: [],
  setCalls: (calls) => set({ calls }),

  bolos: [],
  setBolos: (bolos) => set({ bolos }),
}));
