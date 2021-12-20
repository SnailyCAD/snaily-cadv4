import * as React from "react";
import * as L from "leaflet";
import "leaflet.markercluster";
import J from "jquery";
import { v4 } from "uuid";
import { convertToMap, createCluster, getMapBounds, stringCoordToFloat } from "lib/map/utils";
import {
  Blip,
  BLIP_SIZES,
  CustomMarker,
  defaultTypes,
  IIcon,
  LatLng,
  MarkerPayload,
} from "types/Map";
import { blipTypes } from "lib/map/blips";
import { BlipInfoHTML, CallInfoHTML, PlayerInfoHTML } from "lib/map/html";

const MAP_ELEMENT_ID = "__MAP__";
const TILES_URL = "/tiles/minimap_sea_{y}_{x}.png";

export function Map() {
  const [markerTypes, setMarkerTypes] = React.useState<Record<number, IIcon>>(defaultTypes);
  const [markerStore, setMarkerStore] = React.useState<CustomMarker[]>([]);
  const [blips, setBlips] = React.useState<Blip[][]>([[]]);

  const playerMarkersRef = React.useRef<L.MarkerClusterGroup>(createCluster());
  const mapRef = React.useRef<L.Map>(null);

  const initBlips = React.useCallback(async () => {
    const nameToId: any = {};
    let blipCss = "";
    const copiedTypes = { ...markerTypes };

    const generateBlips = async () => {
      blipCss = `.blip {
          background: url("/map/blips_texturesheet.png");
          background-size: ${1024 / 2}px ${1024 / 2}px;
          display: inline-block;
          width: ${BLIP_SIZES.width}px;
          height: ${BLIP_SIZES.height}px;
        }`;

      const current = {
        x: 0,
        y: 0,
        id: 0,
      };

      for (const blipName in blipTypes) {
        const blip = blipTypes[blipName];

        if (!blip.id) {
          current.id = current.id + 1;
        } else {
          current.id = blip.id;
        }

        if (!blip.x) {
          current.x += 1;
        } else {
          current.x = blip.x;
        }

        if (blip.y) {
          current.y = blip.y;
        }

        copiedTypes[current.id] = {
          name: blipName.replace(/([A-Z0-9])/g, " $1").trim(),
          className: `blip blip-${blipName}`,
          iconUrl:
            "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAFElEQVR4XgXAAQ0AAABAMP1L30IDCPwC/o5WcS4AAAAASUVORK5CYII=",
          iconSize: [BLIP_SIZES.width, BLIP_SIZES.height],
          iconAnchor: [BLIP_SIZES.width / 2, 0],
          popupAnchor: [0, 0],
        };

        nameToId[blipName] = current.id;

        const left = current.x * BLIP_SIZES.width + 0;
        const top = current.y * BLIP_SIZES.height + 0;

        blipCss += `.blip-${blipName} { background-position: -${left}px -${top}px }`;
      }

      setMarkerTypes(copiedTypes);

      J("head").append(`<style id="__BLIPS__">${blipCss}</style>`);
      setTimeout(generateBlipControls, 50);

      showBlips();
    };

    const generateBlipControls = () => {
      for (const blipName in blipTypes) {
        J("#blip-control-container").append(
          `<a data-blip-number="${nameToId[blipName]}" id="blip_${blipName}_link" class="blip-button-a list-group-item d-inline-block collapsed blip-enabled" href="#"><span class="blip blip-${blipName}"></span></a>`,
        );
      }

      J(".blip-button-a").on("click", (e) => {
        const element = $(e.currentTarget);

        // toggle blip
        element.addClass("blip-enabled");

        showBlips();
      });
    };

    const blipSuccess = async (data: any) => {
      for (const idStr in data) {
        const id = Number(idStr);
        const blipArray = data[id];

        for (const i in blipArray) {
          const blip = blipArray[i];
          const fallback = copiedTypes[id];
          const name = fallback?.name ?? "Unknown";
          const description = "N/A";

          createBlip({
            ...blip,
            type: id,
            name,
            description,
          });
        }
      }
    };

    const createBlip = (blip: Blip) => {
      if (!blip.pos) {
        if (!blip?.pos) {
          blip.pos = {
            x: blip.x,
            y: blip.y,
            z: blip.z,
          };

          delete blip.x;
          delete blip.y;
          delete blip.z;
        }
      }

      const obj: MarkerPayload = {
        title: blip.name,
        pos: blip.pos,
        description: blip.description,
        icon: copiedTypes[blip.type] ?? null,
        id: v4(),
        isBlip: true,
      };

      if (!blips?.[blip.type]) {
        setBlips((prev) => {
          prev[blip.type] = [];
          return prev;
        });
      }

      const marker = createMarker(false, obj, blip.name);
      if (!marker) return;

      setBlips((prev) => {
        prev[blip.type]?.push(blip);
        return prev;
      });
    };

    await generateBlips();

    const data = await fetch("/blips.json")
      .then((r) => r.json())
      .catch(() => null);

    if (data) {
      blipSuccess(data);
    }

    // eslint-disable-next-line
  }, [markerTypes, blips]);

  function showBlips() {
    if (!mapRef.current) {
      console.error("no mapRef.current");
      return;
    }

    for (const id in blips) {
      const blipArr: Blip[] = blips[id] ?? [];

      blipArr.forEach((blip) => {
        const marker = markerStore?.[blip.markerId];

        marker?.addTo(mapRef.current!);
      });
    }
  }

  function createMarker(draggable: boolean, payload: MarkerPayload, title: string) {
    let newPos: LatLng;
    if (!payload.pos || !mapRef.current) return;

    if ("lat" in payload.pos) {
      newPos = {
        lat: payload.pos.lat,
        lng: payload.pos.lng,
      };
    } else {
      const coords = stringCoordToFloat(payload.pos);
      const converted = convertToMap(coords.x, coords.y, mapRef.current);
      if (!converted) return;

      newPos = converted;
    }

    const infoContent =
      (payload.player && PlayerInfoHTML(payload.player)) ||
      (payload.call && CallInfoHTML(payload.call)) ||
      BlipInfoHTML(payload);

    // todo: add PlayerMarkers
    const where = payload.player ? {} : mapRef.current;

    const marker: CustomMarker = (L as any)
      .marker(newPos, {
        title,
        draggable,
      })
      .addTo(where)
      .bindPopup(infoContent);

    if (payload.icon !== null && payload.icon?.iconUrl) {
      const img = L.icon(payload.icon);
      marker.setIcon(img);
    }

    marker.payload = payload;

    setMarkerStore((p) => [...p, marker]);
    return marker;
  }

  React.useEffect(() => {
    const ref = mapRef.current;

    if (!ref) {
      // @ts-expect-error ignore
      mapRef.current = initMap(playerMarkersRef);

      initBlips();
    }

    return () => {
      ref && ref.remove();
    };
  }, [initBlips]);

  return (
    <>
      <div id={MAP_ELEMENT_ID} style={{ zIndex: 1, height: "calc(100vh - 4rem)", width: "100%" }} />
    </>
  );
}

function initMap(playerMarkersRef: React.RefObject<L.MarkerCluster>) {
  const TileLayer = L.tileLayer(TILES_URL, {
    minZoom: -2,
    maxZoom: 2,
    tileSize: 1024,
    maxNativeZoom: 0,
    minNativeZoom: 0,
  });

  const map = L.map(MAP_ELEMENT_ID, {
    crs: L.CRS.Simple,
    layers: [TileLayer],
    zoomControl: false,
  }).setView([0, 0], 0);

  const bounds = getMapBounds(map);

  map.setMaxBounds(bounds.pad(1));
  map.fitBounds(bounds);

  if (playerMarkersRef.current) {
    map.addLayer(playerMarkersRef.current);
  }

  return map;
}
