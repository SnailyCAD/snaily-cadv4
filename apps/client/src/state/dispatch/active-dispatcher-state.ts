import type { Call911, Call911Event, ActiveDispatchers, AssignedUnit } from "@snailycad/types";
import { create } from "zustand";

export type Full911Call = Call911 & { assignedUnits: AssignedUnit[]; events: Call911Event[] };

interface ActiveDispatcherState {
  activeDispatchersCount: number;
  setActiveDispatchersCount(count: number): void;

  userActiveDispatcher: ActiveDispatchers | null;
  setUserActiveDispatcher(dispatcher: ActiveDispatchers | null, count?: number): void;
}

export const useActiveDispatcherState = create<ActiveDispatcherState>()((set) => ({
  activeDispatchersCount: 0,
  setActiveDispatchersCount: (count) => set({ activeDispatchersCount: count }),

  userActiveDispatcher: null,
  setUserActiveDispatcher: (dispatcher, count) =>
    set({ userActiveDispatcher: dispatcher, activeDispatchersCount: count }),
}));
