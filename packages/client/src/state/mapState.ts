import create from "zustand";

interface DispatchMapState {
  blipsHidden: boolean;
  setBlipsHidden(b: boolean): void;
}

export const useDispatchMapState = create<DispatchMapState>()((set) => ({
  blipsHidden: false,
  setBlipsHidden: (v) => set({ blipsHidden: v }),
}));
