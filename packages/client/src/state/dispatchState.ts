import type { DeputyWithDept } from "src/pages/ems-fd/my-deputies";
import type { OfficerWithDept } from "src/pages/officer/my-officers";
import type {
  Bolo,
  Call911,
  Citizen,
  StatusValue,
  Call911Event,
  Value,
  ActiveDispatchers,
  LeoWhitelistStatus,
  ValueType,
  AssignedUnit,
} from "@snailycad/types";
import create from "zustand";

export type Full911Call = Call911 & { assignedUnits: AssignedUnit[]; events: Call911Event[] };
export type FullBolo = Bolo & { officer: FullOfficer | null };
export type FullOfficer = OfficerWithDept & {
  status: StatusValue;
  citizen: Pick<Citizen, "name" | "surname" | "id"> | null;
  whitelistStatus: LeoWhitelistStatus | null;
};
export type FullDeputy = DeputyWithDept & {
  rank?: Value<ValueType.OFFICER_RANK>;
  status: StatusValue;
};

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

  activeDispatchers: ActiveDispatchers[];
  setActiveDispatchers: (dispatchers: ActiveDispatchers[]) => void;
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
}));
