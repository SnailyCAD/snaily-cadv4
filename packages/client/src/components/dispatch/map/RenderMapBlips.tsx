import * as React from "react";
import { icon as leafletIcon } from "leaflet";
import { Marker, Tooltip, useMap } from "react-leaflet";
import { convertToMap } from "lib/map/utils";
import { blipTypes } from "lib/map/blips";
import { BLIP_SIZES, Blip, BlipsData, MarkerType } from "types/Map";
import { MapItem, useDispatchMapState } from "state/mapState";

export function RenderMapBlips() {
  const map = useMap();
  const [blips, setBlips] = React.useState<Blip[]>([]);
  const { hiddenItems } = useDispatchMapState();

  const doBlips = React.useCallback(async () => {
    setBlips(await generateBlips(map));
  }, [map]);

  React.useEffect(() => {
    doBlips();
  }, [doBlips]);

  if (hiddenItems[MapItem.BLIPS]) {
    return null;
  }

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
            <Tooltip direction="top">{blip.name}</Tooltip>
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

  const blipsToProcess = Object.entries(blipsData);

  const blipsPositions = blipsToProcess.flatMap(([blipId, blipData]) => {
    return blipData.flatMap((data) => {
      return {
        x: "x" in data ? data.x : data.pos.x,
        y: "y" in data ? data.y : data.pos.y,
        z: "z" in data ? data.z : data.pos.z,
        blipId: parseInt(blipId, 10),
      };
    });
  });

  const blips: Blip[] = blipsPositions.map((blipPosition) => {
    const markerData = markerTypes[blipPosition.blipId];

    return {
      name: markerData?.name ?? String(blipPosition.blipId),
      description: null,
      pos: convertToMap(blipPosition.x, blipPosition.y, map),
      rawPos: blipPosition,
      type: blipPosition.blipId,
      icon: markerData ? leafletIcon(markerData) : undefined,
    };
  });

  return blips;
}

export function generateMarkerTypes() {
  const markerTypes: Record<number, MarkerType> = {};

  let blipCss = `.blip {
    background: url("/map/blips_texturesheet.png");
    background-size: ${1024 / 2}px ${2000 / 2}px;
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
    const blip = blipTypes[blipName]!;

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
