import type { CombinedEmsFdUnit, CombinedLeoUnit, EmsFdDeputy, Officer } from "@snailycad/types";
import { type ConnectionStatus } from "@snailycad/ui";
import { type Socket } from "socket.io-client";
import type { SmartMotorwaySignMarker, SmartSignMarker } from "types/map";
import { persist, createJSONStorage } from "zustand/middleware";
import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";

export enum MapItem {
  CALLS,
  UNITS_ONLY,
  BLIPS,
  SMART_SIGNS,
  SMART_MOTORWAY_SIGNS,
}

interface DispatchMapState {
  activeUnits: (EmsFdDeputy | Officer | CombinedLeoUnit | CombinedEmsFdUnit)[];
  setActiveMapUnits(units: (EmsFdDeputy | Officer | CombinedLeoUnit | CombinedEmsFdUnit)[]): void;

  smartSigns: SmartSignMarker[];
  setSmartSigns(signs: SmartSignMarker[]): void;

  smartMotorwaySigns: SmartMotorwaySignMarker[];
  setSmartMotorwaySigns(signs: SmartMotorwaySignMarker[]): void;

  hiddenItems: Partial<Record<MapItem, boolean>>;
  setItem(item: MapItem): void;

  currentMapServerURL: string | null;
  setCurrentMapServerURL(url: string): void;

  openUnits: string[];
  setOpenUnits(units: string[]): void;

  openCalls: string[];
  setOpenCalls(calls: string[]): void;
}

interface SocketStore {
  socket: Socket | null;
  setSocket(socket: Socket): void;

  status: ConnectionStatus | null;
  setStatus(status: ConnectionStatus): void;
}

interface MapStore {
  map: L.Map | null;
  setMap(map: L.Map): void;
}

export const useDispatchMapState = createWithEqualityFn<DispatchMapState>()(
  persist(
    (set) => ({
      activeUnits: [],
      setActiveMapUnits(activeUnits) {
        set({ activeUnits });
      },

      openCalls: [],
      setOpenCalls(calls) {
        set({ openCalls: calls });
      },

      openUnits: [],
      setOpenUnits(units) {
        set({ openUnits: units });
      },

      smartSigns: [],
      setSmartSigns(signs) {
        set({ smartSigns: signs });
      },

      smartMotorwaySigns: [],
      setSmartMotorwaySigns(signs) {
        set({ smartMotorwaySigns: signs });
      },

      currentMapServerURL: null,
      setCurrentMapServerURL(url) {
        set({ currentMapServerURL: url });
      },

      hiddenItems: { [MapItem.UNITS_ONLY]: true },
      setItem(item) {
        set((state) => ({
          hiddenItems: {
            ...state.hiddenItems,
            [item]: !state.hiddenItems[item],
          },
        }));
      },
    }),
    {
      partialize: (state) => ({
        hiddenItems: state.hiddenItems,
        currentMapServerURL: state.currentMapServerURL,
      }),
      name: "dispatch-map-state-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
  shallow,
);

export const useSocketStore = createWithEqualityFn<SocketStore>()(
  (set) => ({
    status: null,
    setStatus(status) {
      set({ status });
    },

    socket: null,
    setSocket(socket) {
      set({ socket });
    },
  }),
  shallow,
);

export const useMapStore = createWithEqualityFn<MapStore>()(
  (set) => ({
    map: null,
    setMap(map) {
      set({ map });
    },
  }),
  shallow,
);
