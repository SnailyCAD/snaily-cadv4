import * as React from "react";
import { convertToMap } from "lib/map/utils";
import { Marker, Popup, Tooltip, useMap } from "react-leaflet";
import { SmartMotorwaySignSpeedType, type SmartMotorwaySignMarker } from "types/map";
import { icon as leafletIcon } from "leaflet";
import { useTranslations } from "next-intl";
import { MapItem, useDispatchMapState, useSocketStore } from "state/mapState";
import { generateMarkerTypes } from "../render-map-blips";
import { Button, SelectField } from "@snailycad/ui";
import { Permissions, usePermission } from "hooks/usePermission";
import { toastMessage } from "lib/toastMessage";

interface Props {
  marker: SmartMotorwaySignMarker & { id: number };
}

const SPEED_INDICATORS = Object.values(SmartMotorwaySignSpeedType).filter(
  (v) => !isNaN(Number(v)),
) as number[];

export function SmartMotorwaySignsMarker({ marker }: Props) {
  const map = useMap();
  const socket = useSocketStore((state) => state.socket);
  const [markerConfiguration, setMarkerConfiguration] = React.useState<string[]>([]);

  const t = useTranslations("Leo");
  const hiddenItems = useDispatchMapState((state) => state.hiddenItems);
  const markerTypes = React.useMemo(generateMarkerTypes, []);

  const { hasPermissions } = usePermission();
  const hasManageSmartSignsPermissions = hasPermissions([Permissions.ManageSmartSigns]);

  const pos = React.useMemo(
    () => convertToMap(marker.position.x, marker.position.y, map),
    [marker.position], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const markerIcon = React.useMemo(() => {
    // eslint-disable-next-line prefer-destructuring
    const icon = markerTypes[780];

    if (icon) {
      return leafletIcon(icon);
    }

    return undefined;
  }, [markerTypes]);

  React.useEffect(() => {
    const speeds = marker.speeds ?? marker.defaultSpeeds;
    if (speeds) {
      setMarkerConfiguration(speeds.map((speed) => String(speed)));
    }
  }, [marker.speeds, marker.defaultSpeeds]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!socket?.connected) return;

    socket.emit("sna-live-map:update-smart-motorway-sign", {
      ...marker,
      speeds: markerConfiguration.map((v) => Number(v)),
      id: marker.id + 1,
    });

    toastMessage({
      icon: "success",
      title: t("smartSignUpdated"),
      message: t("smartSignUpdatedMessage"),
    });
  }

  if (hiddenItems[MapItem.SMART_MOTORWAY_SIGNS]) {
    return null;
  }

  return (
    <Marker icon={markerIcon} position={pos}>
      <Tooltip direction="top">Smart Motorway Sign</Tooltip>

      <Popup minWidth={300}>
        <p style={{ margin: 2 }}>
          <strong>Direction:</strong> {marker.direction}
        </p>

        <p style={{ margin: 2 }}>
          <strong>Lanes:</strong> {marker.lanes}
        </p>

        <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-y-2">
          {new Array(marker.lanes).fill(null).map((_, idx) => {
            return (
              <SelectField
                selectedKey={markerConfiguration[idx]}
                onSelectionChange={(key) =>
                  setMarkerConfiguration((prev) => {
                    const newConfig = [...prev];
                    newConfig[idx] = String(key);
                    return newConfig;
                  })
                }
                key={idx}
                label="Lane Speed"
                options={SPEED_INDICATORS.map((key) => ({
                  textValue: t(`motorway_sign_${key}`),
                  label: (
                    <p className="flex items-center gap-2">
                      <img src={`/map/smart-motorways/${key}.png`} width={30} height={30} />
                      {t(`motorway_sign_${key}`)}
                    </p>
                  ),
                  value: String(key),
                }))}
              />
            );
          })}

          <Button className="mt-2" type="submit" disabled={!hasManageSmartSignsPermissions}>
            Save
          </Button>
        </form>
      </Popup>
    </Marker>
  );
}
