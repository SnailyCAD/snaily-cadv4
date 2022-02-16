import L from "leaflet";
import type { XYZ } from "types/Map";

const TILE_SIZE = 1024;
export const GAME = {
  x_1: -4000.0 - 230,
  y_1: 8000.0 + 420,
  x_2: 400.0 - 30,
  y_2: -300.0 - 340.0,
};

export function getMapBounds(map: L.Map) {
  const h = TILE_SIZE * 3;
  const w = TILE_SIZE * 2;

  const southWest = map.unproject([0, h], 0);
  const northEast = map.unproject([w, 0], 0);

  return new L.LatLngBounds(southWest, northEast);
}

export function convertToMap(x: number, y: number, map: L.Map) {
  const height = TILE_SIZE * 3;
  const width = TILE_SIZE * 2;

  const latLng1 = map.unproject([0, 0], 0);
  const latLng2 = map.unproject([width / 2, height - TILE_SIZE], 0);

  const rLng = latLng1.lng + ((x - GAME.x_1) * (latLng1.lng - latLng2.lng)) / (GAME.x_1 - GAME.x_2);
  const rLat = latLng1.lat + ((y - GAME.y_1) * (latLng1.lat - latLng2.lat)) / (GAME.y_1 - GAME.y_2);

  return { lat: rLat, lng: rLng };
}

export function stringCoordToFloat(coord: XYZ) {
  return {
    x: parseFloat(`${coord.x}`),
    y: parseFloat(`${coord.y}`),
    z: parseFloat(`${coord.z}`),
  };
}

export function createCluster() {
  return (L as any).markerClusterGroup({
    maxClusterRadius: 20,
    spiderfyOnMaxZoom: false,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: false,
  });
}
