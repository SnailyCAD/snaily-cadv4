import type { Call911 } from "@snailycad/types";

export interface Player {
  Weapon?: string;
  Vehicle?: string;
  "License Plate"?: string;
  Location: string;
  pos: XYZ;
  identifier: string;
  icon: string;
  name: string;
  leo?: boolean;
  ems_fd?: boolean;
}

export type DataActions =
  | {
      type: "playerLeft";
      payload: string;
    }
  | {
      type: "playerData";
      payload: Player[];
    };

export interface XYZ {
  x: number | undefined;
  y: number | undefined;
  z: number | undefined;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface MarkerPayload {
  pos: XYZ | LatLng;
  icon: L.IconOptions | null;
  description: string;
  title: string;
  player?: Player;
  call?: Call911;
  id: string;

  isPlayer?: boolean;
  isBlip?: boolean;
}

export interface CustomMarker extends L.Marker {
  payload: MarkerPayload;
}

export interface Blip {
  pos: XYZ;
  icon: L.IconOptions;
  description: string;
  name: string;
  type: any;
  markerId: number;
  x?: number;
  y?: number;
  z?: number;
}

export interface IIcon extends L.IconOptions {
  name?: string;
}

export interface IPopup extends L.Popup {
  payload: {
    identifier: string;
  };
}

export const defaultTypes: Record<number, IIcon> = {
  0: {
    iconUrl:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAFElEQVR4XgXAAQ0AAABAMP1L30IDCPwC/o5WcS4AAAAASUVORK5CYII=",
    iconSize: [0, 0],
    popupAnchor: [0, 0],
  },
  6: {
    iconUrl: "https://unpkg.com/leaflet@1.7.0/dist/images/marker-icon-2x.png",
    iconSize: [25, 40],
    popupAnchor: [0, 2],
  },
  // police car
  // 5: {},
  // fire truck
  // 4: {},
  // ambulance
  // 3: {},
};

export const BLIP_SIZES = {
  width: 64 / 2,
  height: 64 / 2,
};
