import { LatLngBounds } from "leaflet";
import type { XYZ } from "types/map";

const TILE_SIZE = 1024 as const;

export const GAME = {
  x_1: -4000.0 - 230,
  y_1: 8000.0 + 420,
  x_2: 400.0 - 30,
  y_2: -300.0 - 340.0,
} as const;

export function getMapBounds(map: L.Map) {
  const h = TILE_SIZE * 3;
  const w = TILE_SIZE * 2;

  const southWest = map.unproject([0, h], 0);
  const northEast = map.unproject([w, 0], 0);

  return new LatLngBounds(southWest, northEast);
}

export function convertToMap(rawX: XYZ["x"], rawY: XYZ["y"], map: L.Map) {
  const { x, y } = stringCoordToFloat({ x: rawX, y: rawY, z: 0 });
  const height = TILE_SIZE * 3;
  const width = TILE_SIZE * 2;

  const latLng1 = map.unproject([0, 0], 0);
  const latLng2 = map.unproject([width / 2, height - TILE_SIZE], 0);

  const rLng = latLng1.lng + ((x - GAME.x_1) * (latLng1.lng - latLng2.lng)) / (GAME.x_1 - GAME.x_2);
  const rLat = latLng1.lat + ((y - GAME.y_1) * (latLng1.lat - latLng2.lat)) / (GAME.y_1 - GAME.y_2);

  return { lat: rLat, lng: rLng };
}

// todo: test this out
export function convertToCoords(lat: number, lng: number, map: L.Map) {
  const { lat: lat1, lng: lng1 } = map.unproject([0, 0], 0);
  const { lat: lat2, lng: lng2 } = map.unproject([TILE_SIZE * 2, TILE_SIZE * 3 - TILE_SIZE], 0);

  const x = GAME.x_1 + ((lng - lng1) * (GAME.x_1 - GAME.x_2)) / (lng1 - lng2);
  const y = GAME.y_1 + ((lat - lat1) * (GAME.y_1 - GAME.y_2)) / (lat1 - lat2);

  return { x, y, z: 0 };
}

function stringCoordToFloat(coord: XYZ<string | number | undefined>) {
  return {
    x: parseFloat(String(coord.x)),
    y: parseFloat(String(coord.y)),
    z: parseFloat(String(coord.z)),
  };
}
