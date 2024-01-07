import * as React from "react";
import { CRS } from "leaflet";
import { MapContainer, TileLayer } from "react-leaflet";
import { getMapBounds } from "lib/map/utils";
import { RenderMapBlips } from "./render-map-blips";
import { RenderActiveCalls } from "./calls/render-active-map-calls";
import { RenderMapPlayers } from "./units/render-map-players";
import { SelectMapServerModal } from "./modals/select-map-server-modal";
import { RenderMapSmartSigns } from "./smart-signs/render-map-smart-signs";
import { RenderMapSmartMotorwaySigns } from "./smart-motorway-signs/render-map-smart-motorway-signs";
import { MapSidebar } from "./sidebar/map-sidebar";
import { useMapStore } from "state/mapState";

const TILES_URL = "/tiles/minimap_sea_{y}_{x}.webp" as const;

export function Map() {
  const mapStore = useMapStore();

  const bounds = React.useMemo(
    () => (mapStore.map ? getMapBounds(mapStore.map) : undefined),
    [mapStore.map],
  );

  React.useEffect(() => {
    if (bounds) {
      mapStore.map?.setMaxBounds(bounds);
      mapStore.map?.fitBounds(bounds);
      mapStore.map?.setZoom(-2);
      mapStore.map?.getBounds();
    }
  }, [bounds]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <MapSidebar />

      <MapContainer
        className="col-span-2"
        ref={(map) => {
          map && mapStore.setMap(map);
        }}
        style={{ zIndex: 1, height: "calc(100vh - 3.5rem)", width: "100%" }}
        crs={CRS.Simple}
        center={[0, 0]}
        zoom={-2}
        bounds={bounds}
        zoomControl={false}
      >
        <TileLayer
          url={TILES_URL}
          minZoom={-2}
          maxZoom={2}
          tileSize={1024}
          maxNativeZoom={0}
          minNativeZoom={0}
        />

        <RenderMapPlayers />
        <RenderMapBlips />
        <RenderActiveCalls />
        <RenderMapSmartSigns />
        <RenderMapSmartMotorwaySigns />

        <SelectMapServerModal />
      </MapContainer>
    </>
  );
}
