import { DeputyWithDept } from "src/pages/ems-fd/my-deputies";
import type { EmsFdDeputy, StatusValue, Value } from "types/prisma";
import create from "zustand";

export type ActiveDeputy = EmsFdDeputy & { department: Value<"DEPARTMENT">; status: StatusValue };

interface EmsFdState {
  activeDeputy: ActiveDeputy | null;
  setActiveDeputy: (deputy: ActiveDeputy | null) => void;

  deputies: DeputyWithDept[];
  setDeputies: (deputies: DeputyWithDept[]) => void;
}

export const useEmsFdState = create<EmsFdState>((set) => ({
  activeDeputy: null,
  setActiveDeputy: (deputy) => set({ activeDeputy: deputy }),

  deputies: [],
  setDeputies: (deputies) => set({ deputies }),
}));
