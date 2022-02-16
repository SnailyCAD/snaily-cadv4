import type { PointTuple, LatLngLiteral } from "leaflet";

export interface Player {
  Weapon?: string;
  Vehicle?: string;
  "License Plate"?: string;
  Location: string;
  pos: XYZ | null;
  identifier: string;
  icon: string;
  name: string;
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

export const BLIP_SIZES = {
  width: 32,
  height: 32,
} as const;

export interface Blip {
  name: string;
  description: string | null;
  pos: LatLngLiteral;
  rawPos?: XYZ;
  type: number;
  icon: L.Icon | undefined;
}

export interface MarkerType {
  name: string;
  className: string;
  iconUrl: string;
  iconSize: PointTuple;
  iconAnchor: PointTuple;
  popupAnchor: PointTuple;
}

export type BlipsData = Record<string, (XYZ | { pos: XYZ })[]>;
