import type { Call911 } from "@snailycad/types";

export interface Player {
  Weapon?: string;
  Vehicle?: string;
  "License Plate"?: string;
  Location: string;
  pos: XYZ | null;
  identifier: string;
  icon: string;
  name: string;
  leo?: boolean;
  ems_fd?: boolean;
}

export interface PlayerDataEvent {
  type: "playerData";
  payload: Player[];
}

export interface PlayerLeftEvent {
  type: "playerLeft";
  payload: string;
}

export type DataActions = PlayerLeftEvent | PlayerDataEvent;

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

export const BLIP_SIZES = {
  width: 64 / 2,
  height: 64 / 2,
};
