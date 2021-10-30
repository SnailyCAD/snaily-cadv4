import { DeputyWithDept } from "src/pages/ems-fd/my-deputies";
import { OfficerWithDept } from "src/pages/officer/my-officers";
import type {
  Bolo,
  Call911,
  Citizen,
  Officer,
  StatusValue,
  Call911Event,
  Value,
} from "types/prisma";
import create from "zustand";

export type Full911Call = Call911 & { assignedUnits: FullOfficer[]; events: Call911Event[] };
export type FullBolo = Bolo & { officer: Officer | null };
export type FullOfficer = OfficerWithDept & {
  status: StatusValue;
  citizen: Pick<Citizen, "name" | "surname" | "id"> | null;
};
export type FullDeputy = DeputyWithDept & { rank: Value<"OFFICER_RANK">; status: StatusValue };

interface DispatchState {
  calls: Full911Call[];
  setCalls: (calls: Full911Call[]) => void;

  bolos: FullBolo[];
  setBolos: (bolos: FullBolo[]) => void;

  activeOfficers: FullOfficer[];
  setActiveOfficers: (officers: FullOfficer[]) => void;

  activeDeputies: FullDeputy[];
  setActiveDeputies: (deputies: FullDeputy[]) => void;

  allOfficers: FullOfficer[];
  setAllOfficers: (officers: FullOfficer[]) => void;

  allDeputies: FullDeputy[];
  setAllDeputies: (deputies: FullDeputy[]) => void;
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
}));
