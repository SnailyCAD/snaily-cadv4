import type {
  Bolo,
  Call911,
  Call911Event,
  ActiveDispatchers,
  AssignedUnit,
  CombinedLeoUnit,
  Officer,
  EmsFdDeputy,
} from "@snailycad/types";
import create from "zustand";
import type { FullIncident } from "src/pages/officer/incidents";

export type Full911Call = Call911 & { assignedUnits: AssignedUnit[]; events: Call911Event[] };

interface DispatchState {
  calls: Full911Call[];
  setCalls(calls: Full911Call[]): void;

  bolos: Bolo[];
  setBolos(bolos: Bolo[]): void;

  activeOfficers: (Officer | CombinedLeoUnit)[];
  setActiveOfficers(officers: (Officer | CombinedLeoUnit)[]): void;

  activeDeputies: EmsFdDeputy[];
  setActiveDeputies(deputies: EmsFdDeputy[]): void;

  allOfficers: Officer[];
  setAllOfficers(officers: Officer[]): void;

  allDeputies: EmsFdDeputy[];
  setAllDeputies(deputies: EmsFdDeputy[]): void;

  activeDispatchers: ActiveDispatchers[];
  setActiveDispatchers(dispatchers: ActiveDispatchers[]): void;

  activeIncidents: FullIncident[];
  setActiveIncidents(incidents: FullIncident[]): void;
}

export const useDispatchState = create<DispatchState>((set) => ({
  calls: [],
  setCalls: (calls) => set({ calls }),

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
}));
