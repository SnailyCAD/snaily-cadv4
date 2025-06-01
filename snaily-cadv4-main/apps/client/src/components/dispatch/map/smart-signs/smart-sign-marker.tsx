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
import { toastMessage } from "lib/toastMessage";
import { z } from "zod";

interface Props {
  marker: SmartSignMarker;
}

export function SmartSignsMarker({ marker }: Props) {
  const map = useMap();
  const socket = useSocketStore((state) => state.socket);
  const [markerText, setMarkerText] = React.useState<
    SmartSignMarker["defaultText"] & { editing?: boolean }
  >(safeParseSmartSignText(marker.defaultText));

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

  React.useEffect(() => {
    if (!markerText.editing) setMarkerText(safeParseSmartSignText(marker.defaultText));
  }, [marker.defaultText, markerText.editing]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!socket?.connected) return;

    socket.emit("sna-live-map:update-smart-sign", {
      ...marker,
      defaultText: {
        firstLine: markerText.firstLine.toLowerCase() || null,
        secondLine: markerText.secondLine.toLowerCase() || null,
        thirdLine: markerText.thirdLine.toLowerCase() || null,
      },
    });

    toastMessage({
      icon: "success",
      title: t("smartSignUpdated"),
      message: t("smartSignUpdatedMessage"),
    });

    setTimeout(() => {
      setMarkerText({
        ...markerText,
        editing: false,
      });
    }, 500); // clear editing state after 500ms
  }

  if (hiddenItems[MapItem.SMART_SIGNS]) {
    return null;
  }

  return (
    <Marker icon={playerIcon} key={marker.id} position={pos}>
      <Tooltip direction="top">SmartSign {marker.id}</Tooltip>

      <Popup minWidth={300}>
        <p style={{ margin: 2 }}>
          <strong>SmartSign {marker.id}</strong>
        </p>

        <form onSubmit={handleSubmit} className="mt-3">
          <Input
            name="firstLine"
            readOnly={!hasManageSmartSignsPermissions}
            className="rounded-b-none !text-amber-600 font-bold text-[15px] uppercase"
            value={markerText.firstLine.toUpperCase()}
            onChange={(event) =>
              setMarkerText({ ...markerText, editing: true, firstLine: event.target.value })
            }
            maxLength={15}
          />
          <Input
            name="secondLine"
            readOnly={!hasManageSmartSignsPermissions}
            className="rounded-none -my-1 !text-amber-600 font-bold text-[15px] uppercase"
            value={markerText.secondLine.toUpperCase()}
            onChange={(event) =>
              setMarkerText({ ...markerText, editing: true, secondLine: event.target.value })
            }
            maxLength={15}
          />
          <Input
            name="thirdLine"
            readOnly={!hasManageSmartSignsPermissions}
            className="rounded-t-none !text-amber-600 font-bold text-[15px] uppercase"
            value={markerText.thirdLine.toUpperCase()}
            onChange={(event) =>
              setMarkerText({ ...markerText, editing: true, thirdLine: event.target.value })
            }
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

const smartSignTextSchema = z.object({
  firstLine: z.string(),
  secondLine: z.string(),
  thirdLine: z.string(),
});

function safeParseSmartSignText(obj: unknown) {
  const data = smartSignTextSchema.safeParse(obj);
  return data.success
    ? data.data
    : {
        firstLine: "",
        secondLine: "",
        thirdLine: "",
      };
}
