import { convertToMap } from "lib/map/utils";
import * as React from "react";
import { Marker, Popup, Tooltip, useMap } from "react-leaflet";
import type { SmartSignMarker } from "types/map";
import { icon as leafletIcon } from "leaflet";
import { useTranslations } from "next-intl";
import { MapItem, useDispatchMapState } from "state/mapState";
import { generateMarkerTypes } from "../render-map-blips";

interface Props {
  marker: SmartSignMarker;
}

export function SmartSignsMarker({ marker }: Props) {
  const map = useMap();
  const t = useTranslations("Leo");
  const { hiddenItems } = useDispatchMapState();
  const markerTypes = React.useMemo(generateMarkerTypes, []);

  const playerIcon = React.useMemo(() => {
    // eslint-disable-next-line prefer-destructuring
    const icon = markerTypes[780];

    if (icon) {
      return leafletIcon(icon);
    }

    return undefined;
  }, [markerTypes]);

  const pos = React.useMemo(() => convertToMap(marker.x, marker.y, map), [marker, map]);
  if (!pos) return null;

  if (hiddenItems[MapItem.SMART_SIGNS]) {
    return null;
  }

  return (
    <Marker icon={playerIcon} key={marker.id} position={pos}>
      <Tooltip direction="top">SmartSign</Tooltip>

      <Popup minWidth={300}>
        <p style={{ margin: 2 }}>
          <strong>{t("id")}:</strong> {marker.id}
        </p>

        <p
          className="text-amber-600"
          style={{ margin: "6px 2px", textTransform: "uppercase", fontWeight: "bold" }}
        >
          {marker.defaultText.firstLine}
          <br />
          {marker.defaultText.secondLine}
          <br />
          {marker.defaultText.thirdLine}
          <br />
        </p>
      </Popup>
    </Marker>
  );
}
