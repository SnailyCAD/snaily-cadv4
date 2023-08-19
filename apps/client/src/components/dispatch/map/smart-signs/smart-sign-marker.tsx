import * as React from "react";
import { convertToMap } from "lib/map/utils";
import { Marker, Popup, Tooltip, useMap } from "react-leaflet";
import type { SmartSignMarker } from "types/map";
import { icon as leafletIcon } from "leaflet";
import { useTranslations } from "next-intl";
import { MapItem, useDispatchMapState } from "state/mapState";
import { generateMarkerTypes } from "../render-map-blips";
import { Button, Input } from "@snailycad/ui";
import { Permissions, usePermission } from "hooks/usePermission";

interface Props {
  marker: SmartSignMarker;
}

export function SmartSignsMarker({ marker }: Props) {
  const map = useMap();

  const t = useTranslations("Leo");
  const hiddenItems = useDispatchMapState((state) => state.hiddenItems);
  const markerTypes = React.useMemo(generateMarkerTypes, []);

  const { hasPermissions } = usePermission();
  const hasManageSmartSignsPermissions = hasPermissions([Permissions.ManageSmartSigns]);

  const pos = React.useMemo(() => convertToMap(marker.x, marker.y, map), [marker.x, marker.y]); // eslint-disable-line react-hooks/exhaustive-deps
  const playerIcon = React.useMemo(() => {
    // eslint-disable-next-line prefer-destructuring
    const icon = markerTypes[780];

    if (icon) {
      return leafletIcon(icon);
    }

    return undefined;
  }, [markerTypes]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
  }

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

        <form onSubmit={handleSubmit} className="mt-3">
          <Input
            readOnly={!hasManageSmartSignsPermissions}
            className="rounded-b-none !text-amber-600 font-bold text-[15px]"
            defaultValue={marker.defaultText.firstLine.toUpperCase()}
          />
          <Input
            readOnly={!hasManageSmartSignsPermissions}
            className="rounded-none -my-1 !text-amber-600 font-bold text-[15px]"
            defaultValue={marker.defaultText.secondLine.toUpperCase()}
          />
          <Input
            readOnly={!hasManageSmartSignsPermissions}
            className="rounded-t-none !text-amber-600 font-bold text-[15px]"
            defaultValue={marker.defaultText.thirdLine.toUpperCase()}
          />

          <Button className="mt-2" type="submit" disabled={!hasManageSmartSignsPermissions}>
            Save
          </Button>
        </form>
      </Popup>
    </Marker>
  );
}
