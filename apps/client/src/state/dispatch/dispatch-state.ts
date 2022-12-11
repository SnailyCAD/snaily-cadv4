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
  bolos: Bolo[];
  setBolos(bolos: Bolo[]): void;

  activeOfficers: (Officer | CombinedLeoUnit)[];
  setActiveOfficers(officers: (Officer | CombinedLeoUnit)[]): void;

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

  draggingUnit: "incident" | "call" | "move" | null;
  setDraggingUnit(v: "incident" | "call" | "move" | null): void;
}

export const useDispatchState = create<DispatchState>()((set) => ({
  bolos: [],
  setBolos: (bolos) => set({ bolos }),

  activeOfficers: [],
  setActiveOfficers: (officers) => set({ activeOfficers: officers }),

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
