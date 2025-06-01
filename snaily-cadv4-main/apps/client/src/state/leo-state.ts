import type { AssignedWarrantOfficer, BaseCitizen, Warrant } from "@snailycad/types";
import type { GetActiveOfficerData } from "@snailycad/types/api";
import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";

export type ActiveOfficer = GetActiveOfficerData;

export interface ActiveWarrant extends Warrant {
  citizen: BaseCitizen;
  assignedOfficers: AssignedWarrantOfficer[];
}

interface LeoState {
  activeOfficer: ActiveOfficer | null;
  setActiveOfficer(officer: ActiveOfficer | null): void;
}

export const useLeoState = createWithEqualityFn<LeoState>()(
  (set) => ({
    activeOfficer: null,
    setActiveOfficer: (officer) => set({ activeOfficer: officer }),
  }),
  shallow,
);
