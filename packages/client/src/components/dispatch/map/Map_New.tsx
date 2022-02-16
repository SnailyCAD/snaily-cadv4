import * as React from "react";
import L from "leaflet";
import { MapContainer, TileLayer } from "react-leaflet";
import { getMapBounds } from "lib/map/utils";
import { RenderMapBlips } from "./RenderMapBlips";
import { RenderActiveCalls } from "./RenderActiveCalls";
import { MapActions } from "./MapActions";

const TILES_URL = "/tiles/minimap_sea_{y}_{x}.png" as const;

export function Map() {
  const [map, setMap] = React.useState<L.Map | undefined>();
  const bounds = React.useMemo(() => (map ? getMapBounds(map) : undefined), [map]);

  React.useEffect(() => {
    if (bounds) {
      map?.setMaxBounds(bounds);
      map?.setZoom(-2);
    }
  }, [bounds, map]);

  return (
    <MapContainer
      style={{ zIndex: 1, height: "calc(100vh - 4rem)", width: "100%" }}
      crs={L.CRS.Simple}
      center={[0, 0]}
      scrollWheelZoom
      zoom={-2}
      bounds={bounds}
      whenCreated={setMap}
      zoomControl={false}
    >
      <TileLayer
        minZoom={-2}
        maxZoom={2}
        url={TILES_URL}
        tileSize={1024}
        maxNativeZoom={0}
        minNativeZoom={0}
      />

      <RenderMapBlips />
      <RenderActiveCalls />
      <MapActions />
    </MapContainer>
  );
}
