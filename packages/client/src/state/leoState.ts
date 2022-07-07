import type { AssignedWarrantOfficer, BaseCitizen, Officer, Warrant } from "@snailycad/types";
import type { GetActiveOfficerData } from "@snailycad/types/api";
import create from "zustand";

export type ActiveOfficer = GetActiveOfficerData;

export type ActiveWarrant = Warrant & {
  officer?: Officer | undefined;
  citizen: BaseCitizen;
} & {
  assignedOfficers: AssignedWarrantOfficer[];
};

interface LeoState {
  activeOfficer: ActiveOfficer | null;
  setActiveOfficer(officer: ActiveOfficer | null): void;

  userOfficers: Officer[];
  setUserOfficers(userOfficers: Officer[]): void;

  activeWarrants: ActiveWarrant[];
  setActiveWarrants(warrants: ActiveWarrant[]): void;
}

export const useLeoState = create<LeoState>((set) => ({
  activeOfficer: null,
  setActiveOfficer: (officer) => set({ activeOfficer: officer }),

  userOfficers: [],
  setUserOfficers: (userOfficers) => set({ userOfficers }),

  activeWarrants: [],
  setActiveWarrants: (warrants) => set({ activeWarrants: warrants }),
}));
