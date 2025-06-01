import type {
  CombinedEmsFdUnit,
  CombinedLeoUnit,
  EmsFdDeputy,
  Officer,
  User,
} from "@snailycad/types";
import type { PointTuple, LatLngLiteral, Icon, Marker } from "leaflet";

export interface Player {
  weapon?: string;
  vehicle?: string;
  licensePlate?: string;
  location: string;
  pos: XYZ | null;
  identifiers: { steamId: string | null; discordId: string | null };
  icon: string;
  name: string;
  playerId: number;
  hasSirenEnabled: boolean;
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

export interface XYZ<T extends string | number | undefined = number | undefined> {
  x: T;
  y: T;
  z: T;
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
  icon?: Icon;
}

export interface MarkerType {
  name: string;
  className: string;
  iconUrl: string;
  iconSize: PointTuple;
  iconAnchor: PointTuple;
  popupAnchor: PointTuple;
}

export type BlipsData = Record<number, (XYZ | { pos: XYZ })[]>;

export type PlayerDataEventPayload = PlayerDataEvent["payload"][number] & {
  ref?: Marker | null;
  convertedSteamId?: string | null;
  discordId?: string | null;
  identifier: string;
};
export interface MapPlayer extends User, PlayerDataEventPayload {
  unit: EmsFdDeputy | Officer | CombinedLeoUnit | CombinedEmsFdUnit | null;
  convertedSteamId: string | null;
  discordId: string | null;
  ref: Marker | null;
  identifier: string;
}

export interface SmartSignMarker {
  x: number;
  z: number;
  y: number;
  id: 5;
  defaultText: Record<"firstLine" | "secondLine" | "thirdLine", string>;
}

export enum SmartMotorwaySignSpeedType {
  ArrowLeft = 1,
  ArrowRight = 2,
  RedX = 3,
  Speed20 = 20,
  Speed30 = 30,
  Speed40 = 40,
  Speed50 = 50,
  Speed60 = 60,
  Speed70 = 70,
  Speed80 = 80,
  Speed90 = 90,
  Speed100 = 100,
  Speed110 = 110,
  Speed120 = 120,
  Speed130 = 130,
  Speed140 = 140,
  Speed150 = 150,
}
export interface SmartMotorwaySignMarker {
  defaultSpeeds?: SmartMotorwaySignSpeedType[];
  speeds?: SmartMotorwaySignSpeedType[];
  position: {
    x: number;
    y: number;
    z: number;
  };
  lanes: number;
  direction: string;
}
