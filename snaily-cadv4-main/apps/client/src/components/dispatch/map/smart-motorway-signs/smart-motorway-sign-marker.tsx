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
import Image from "next/image";

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
  const hasManageSmartMotorwaysSignsPermissions = hasPermissions([
    Permissions.ManageSmartMotorwaySigns,
  ]);

  const pos = React.useMemo(
    () => convertToMap(marker.position.x, marker.position.y, map),
    [marker.position], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const markerIcon = React.useMemo(() => {
    // eslint-disable-next-line prefer-destructuring
    const icon = markerTypes[781];

    if (icon) {
      return leafletIcon(icon);
    }

    return undefined;
  }, [markerTypes]);

  React.useEffect(() => {
    const speeds = marker.speeds ?? marker.defaultSpeeds;
    if (Array.isArray(speeds)) {
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
                label={`Lane ${idx + 1}`}
                options={SPEED_INDICATORS.map((key) => ({
                  textValue: t(`motorway_sign_${key}`),
                  label: (
                    <p className="flex items-center gap-2">
                      <Image
                        alt={t(`motorway_sign_${key}`)}
                        src={`/map/smart-motorways/${key}.png`}
                        width={30}
                        height={30}
                      />
                      {t(`motorway_sign_${key}`)}
                    </p>
                  ),
                  value: String(key),
                }))}
              />
            );
          })}

          <section>
            <h3 className="text-lg font-semibold mb-1.5">Preview</h3>

            {markerConfiguration.length <= 0 ? (
              <p className="!m-0">Configure the lanes to see a preview</p>
            ) : (
              <div className="flex items-center justify-between bg-black p-2 rounded-md">
                {new Array(marker.lanes).fill(null).map((_, idx) => {
                  const speed = markerConfiguration[idx];

                  if (!speed) {
                    return <div key={idx} />;
                  }

                  return (
                    <Image
                      className="border-2 border-secondary p-1 rounded"
                      key={idx}
                      alt={t(`motorway_sign_${speed}`)}
                      src={`/map/smart-motorways/${speed}.png`}
                      width={40}
                      height={40}
                    />
                  );
                })}
              </div>
            )}
          </section>

          <div className="flex mt-2 gap-2">
            <Button
              variant="danger"
              className="w-full"
              type="button"
              onPress={() => setMarkerConfiguration([])}
              disabled={!hasManageSmartMotorwaysSignsPermissions}
            >
              Reset
            </Button>
            <Button
              className="w-full"
              type="submit"
              disabled={!hasManageSmartMotorwaysSignsPermissions}
            >
              Save
            </Button>
          </div>
        </form>
      </Popup>
    </Marker>
  );
}
