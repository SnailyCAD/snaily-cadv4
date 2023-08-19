import * as React from "react";
import { convertToMap } from "lib/map/utils";
import { Marker, Popup, Tooltip, useMap } from "react-leaflet";
import type { SmartSignMarker } from "types/map";
import { icon as leafletIcon } from "leaflet";
import { useTranslations } from "next-intl";
import { MapItem, useDispatchMapState, useSocketStore } from "state/mapState";
import { generateMarkerTypes } from "../render-map-blips";
import { Button, Input } from "@snailycad/ui";
import { Permissions, usePermission } from "hooks/usePermission";

interface Props {
  marker: SmartSignMarker;
}

export function SmartSignsMarker({ marker }: Props) {
  const map = useMap();
  const socket = useSocketStore((state) => state.socket);

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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!socket?.connected) return;

    const elements = event.currentTarget.elements as HTMLFormControlsCollection;

    const firstLine = elements.namedItem("firstLine") as HTMLInputElement;
    const secondLine = elements.namedItem("secondLine") as HTMLInputElement;
    const thirdLine = elements.namedItem("thirdLine") as HTMLInputElement;

    socket.emit("sna-live-map:update-smart-sign", {
      ...marker,
      defaultText: {
        firstLine: firstLine.value.toLowerCase() || null,
        secondLine: secondLine.value.toLowerCase() || null,
        thirdLine: thirdLine.value.toLowerCase() || null,
      },
    });
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
            name="firstLine"
            readOnly={!hasManageSmartSignsPermissions}
            className="rounded-b-none !text-amber-600 font-bold text-[15px] uppercase"
            defaultValue={marker.defaultText.firstLine.toUpperCase()}
            maxLength={15}
          />
          <Input
            name="secondLine"
            readOnly={!hasManageSmartSignsPermissions}
            className="rounded-none -my-1 !text-amber-600 font-bold text-[15px] uppercase"
            defaultValue={marker.defaultText.secondLine.toUpperCase()}
            maxLength={15}
          />
          <Input
            name="thirdLine"
            readOnly={!hasManageSmartSignsPermissions}
            className="rounded-t-none !text-amber-600 font-bold text-[15px] uppercase"
            defaultValue={marker.defaultText.thirdLine.toUpperCase()}
            maxLength={15}
          />

          <Button className="mt-2" type="submit" disabled={!hasManageSmartSignsPermissions}>
            Save
          </Button>
        </form>
      </Popup>
    </Marker>
  );
}
