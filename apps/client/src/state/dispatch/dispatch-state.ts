import type {
  Bolo,
  Call911,
  Call911Event,
  AssignedUnit,
  CombinedLeoUnit,
  Officer,
  EmsFdDeputy,
  LeoIncident,
  CombinedEmsFdUnit,
} from "@snailycad/types";
import { create } from "zustand";

export type Full911Call = Call911 & { assignedUnits: AssignedUnit[]; events: Call911Event[] };

interface DispatchState {
  bolos: Bolo[];
  setBolos(bolos: Bolo[]): void;

  activeOfficers: (Officer | CombinedLeoUnit)[];
  setActiveOfficers(officers: (Officer | CombinedLeoUnit)[]): void;

  activeDeputies: (EmsFdDeputy | CombinedEmsFdUnit)[];
  setActiveDeputies(deputies: (EmsFdDeputy | CombinedEmsFdUnit)[]): void;

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

  activeIncidents: [],
  setActiveIncidents: (incidents) => set({ activeIncidents: incidents }),

  draggingUnit: null,
  setDraggingUnit: (v) => set({ draggingUnit: v }),
}));
