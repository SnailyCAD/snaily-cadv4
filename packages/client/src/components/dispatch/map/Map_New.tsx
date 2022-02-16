import * as React from "react";
import L from "leaflet";
import { MapContainer, TileLayer } from "react-leaflet";
import { getMapBounds } from "lib/map/utils";
import { RenderMapBlips } from "./RenderMapBlips";
import { RenderActiveCalls } from "./calls/RenderActiveCalls";
import { MapActions } from "./MapActions";
import { RenderMapPlayers } from "./units/RenderMapPlayers";

const TILES_URL = "/tiles/minimap_sea_{y}_{x}.png" as const;

export function Map() {
  const [map, setMap] = React.useState<L.Map | undefined>();
  const [bounds, setBounds] = React.useState<L.LatLngBounds | null>(null);
  // const bounds = map ? getMapBounds(map) : null;

  React.useEffect(() => {
    console.log("here");
    console.log({ map });

    if (map) {
      setBounds(getMapBounds(map));
    }
  }, [map]);

  React.useEffect(() => {
    if (bounds) {
      map?.setMaxBounds(bounds);
      map?.fitBounds(bounds);
      map?.setZoom(-2);
    }
  }, [bounds, map]);

  console.log({ bounds });

  return (
    <MapContainer
      style={{ zIndex: 1, height: "calc(100vh - 4rem)", width: "100%" }}
      crs={L.CRS.Simple}
      center={[0, 0]}
      zoom={-2}
      whenCreated={setMap}
      zoomControl={false}
    >
      {bounds ? (
        <>
          <TileLayer
            url={TILES_URL}
            minZoom={-2}
            maxZoom={2}
            tileSize={1024}
            maxNativeZoom={0}
            minNativeZoom={0}
          />

          <RenderMapBlips />
          <RenderActiveCalls />
          <RenderMapPlayers />
          <MapActions />
        </>
      ) : null}
    </MapContainer>
  );
}
