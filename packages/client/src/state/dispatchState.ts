import type {
  Bolo,
  Call911,
  Call911Event,
  ActiveDispatchers,
  AssignedUnit,
  CombinedLeoUnit,
  Officer,
  EmsFdDeputy,
  LeoIncident,
} from "@snailycad/types";
import create from "zustand";

export type Full911Call = Call911 & { assignedUnits: AssignedUnit[]; events: Call911Event[] };

interface DispatchState {
  calls: Full911Call[];
  setCalls(calls: Full911Call[]): void;

  bolos: Bolo[];
  setBolos(bolos: Bolo[]): void;

  activeOfficers: Map<(Officer | CombinedLeoUnit)["id"], Officer | CombinedLeoUnit>;
  resetActiveOfficers(): void;
  setActiveOfficerInMap(
    officer: Officer | CombinedLeoUnit | (Officer | CombinedLeoUnit)["id"],
  ): void;

  activeDeputies: EmsFdDeputy[];
  setActiveDeputies(deputies: EmsFdDeputy[]): void;

  allOfficers: (Officer | CombinedLeoUnit)[];
  setAllOfficers(officers: (Officer | CombinedLeoUnit)[]): void;

  allDeputies: EmsFdDeputy[];
  setAllDeputies(deputies: EmsFdDeputy[]): void;

  activeDispatchers: ActiveDispatchers[];
  setActiveDispatchers(dispatchers: ActiveDispatchers[]): void;

  activeIncidents: LeoIncident[];
  setActiveIncidents(incidents: LeoIncident[]): void;

  draggingUnit: "incident" | "call" | null;
  setDraggingUnit(v: "incident" | "call" | null): void;
}

export const useDispatchState = create<DispatchState>()((set, get) => ({
  calls: [],
  setCalls: (calls) => set({ calls }),

  bolos: [],
  setBolos: (bolos) => set({ bolos }),

  activeOfficers: new Map(),
  resetActiveOfficers: () => set({ activeOfficers: new Map() }),
  setActiveOfficerInMap: (officer) => {
    const map = get().activeOfficers;

    if (typeof officer === "string") {
      map.delete(officer);
    } else {
      map.set(officer.id, officer);
    }

    set({ activeOfficers: map });
  },

  activeDeputies: [],
  setActiveDeputies: (deputies) => set({ activeDeputies: deputies }),

  allOfficers: [],
  setAllOfficers: (officers) => set({ allOfficers: officers }),

  allDeputies: [],
  setAllDeputies: (deputies) => set({ allDeputies: deputies }),

  activeDispatchers: [],
  setActiveDispatchers: (dispatchers) => set({ activeDispatchers: dispatchers }),

  activeIncidents: [],
  setActiveIncidents: (incidents) => set({ activeIncidents: incidents }),

  draggingUnit: null,
  setDraggingUnit: (v) => set({ draggingUnit: v }),
}));
