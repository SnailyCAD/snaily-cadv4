import * as React from "react";
import L, { type PointTuple } from "leaflet";
import { Marker, Popup, useMap } from "react-leaflet";
import { convertToMap, stringCoordToFloat } from "lib/map/utils";
import { blipTypes } from "lib/map/blips";
import { BLIP_SIZES, type LatLng, type XYZ } from "types/Map";

interface Blip {
  name: string;
  description: string | null;
  pos: LatLng;
  type: number;
  icon: L.Icon | undefined;
}

interface MarkerType {
  name: string;
  className: string;
  iconUrl: string;
  iconSize: PointTuple;
  iconAnchor: PointTuple;
  popupAnchor: PointTuple;
}

type BlipsData = Record<string, (XYZ | { pos: XYZ })[]>;

export function RenderMapBlips() {
  const map = useMap();
  const [blips, setBlips] = React.useState<Blip[]>([]);

  const doBlips = React.useCallback(async () => {
    setBlips(await generateBlips(map));
  }, [map]);

  React.useEffect(() => {
    doBlips();
  }, [doBlips]);

  return (
    <>
      {blips.map((blip, idx) => {
        return (
          <Marker
            icon={blip.icon}
            draggable={false}
            key={`${blip.name}-${idx}`}
            position={blip.pos}
          >
            <Popup>
              <p className="text-base !m-0">
                <strong>Name: </strong> {blip.name}
              </p>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

async function generateBlips(map: L.Map) {
  const blipsData: BlipsData = await fetch("/blips.json")
    .then((v) => v.json())
    .catch(() => ({}));

  const markerTypes = generateMarkerTypes();
  const createdBlips: Blip[] = [];

  for (const id in blipsData) {
    if (blipsData[id]) {
      const blipArray = blipsData[id];

      for (const i in blipArray) {
        const blipData = blipArray[+i];
        const markerData = markerTypes[+id];
        if (!blipData) continue;

        const pos =
          "pos" in blipData ? blipData.pos : { x: blipData.x, y: blipData.y, z: blipData.z };

        const coords = stringCoordToFloat(pos);
        const converted = convertToMap(coords.x, coords.y, map);

        const blip: Blip = {
          name: markerData?.name ?? id,
          description: null,
          pos: converted,
          type: Number(id),
          icon: markerData
            ? L.icon({
                iconUrl: markerData.iconUrl,
                iconSize: markerData.iconSize,
                className: markerData.className,
                iconAnchor: markerData.iconAnchor,
                popupAnchor: markerData.popupAnchor,
              })
            : undefined,
        };

        createdBlips.push(blip);
      }
    }
  }

  return createdBlips;
}

function generateMarkerTypes() {
  const markerTypes: Record<number, MarkerType> = {};

  let blipCss = `.blip {
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

    markerTypes[current.id] = {
      name: blipName.replace(/([A-Z0-9])/g, " $1").trim(),
      className: `blip blip-${blipName}`,
      iconUrl:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAFElEQVR4XgXAAQ0AAABAMP1L30IDCPwC/o5WcS4AAAAASUVORK5CYII=",
      iconSize: [BLIP_SIZES.width, BLIP_SIZES.height],
      iconAnchor: [BLIP_SIZES.width / 2, 0],
      popupAnchor: [0, 0],
    };

    const left = current.x * BLIP_SIZES.width + 0;
    const top = current.y * BLIP_SIZES.height + 0;

    blipCss += `.blip-${blipName} { background-position: -${left}px -${top}px }`;
  }

  const style = document.createElement("style");
  style.innerHTML = blipCss;
  document.head.appendChild(style);

  return markerTypes;
}
