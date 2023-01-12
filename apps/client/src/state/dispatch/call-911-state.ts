import type { Call911, Call911Event, AssignedUnit } from "@snailycad/types";
import { create } from "zustand";

export type Full911Call = Call911 & { assignedUnits: AssignedUnit[]; events: Call911Event[] };

interface Call911State {
  calls: Full911Call[];
  setCalls(calls: Full911Call[]): void;

  currentlySelectedCall: Full911Call | null;
  setCurrentlySelectedCall(call: Full911Call | null): void;
}

export const useCall911State = create<Call911State>()((set, get) => ({
  calls: [],
  setCalls: (calls) => set({ calls: Array.isArray(calls) ? calls : get().calls }),

  currentlySelectedCall: null,
  setCurrentlySelectedCall: (call) => set({ currentlySelectedCall: call }),
}));
