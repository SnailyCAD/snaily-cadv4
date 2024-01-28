import * as React from "react";
import { icon as leafletIcon } from "leaflet";
import { Marker, Popup, Tooltip, useMap } from "react-leaflet";
import { convertToMap } from "lib/map/utils";
import { Button } from "@snailycad/ui";
import { useTranslations } from "next-intl";
import { useCall911State } from "state/dispatch/call-911-state";
import { CallDescription } from "components/dispatch/active-calls/CallDescription";
import { MapItem, useDispatchMapState } from "state/mapState";
import { useMarkerChange } from "./use-marker-change";

const CALL_ICON_SIZE = 30;

const CALL_ICON = leafletIcon({
  iconUrl: "/map/call.png",
  iconSize: [CALL_ICON_SIZE, CALL_ICON_SIZE],
  popupAnchor: [0, -CALL_ICON_SIZE / 2],
  iconAnchor: [CALL_ICON_SIZE / 2, CALL_ICON_SIZE / 2],
  tooltipAnchor: [0, -CALL_ICON_SIZE / 2],
});

export function RenderActiveCalls() {
  const hiddenItems = useDispatchMapState((state) => state.hiddenItems);
  const { openCalls, setOpenCalls } = useDispatchMapState((state) => ({
    setOpenCalls: state.setOpenCalls,
    openCalls: state.openCalls,
  }));

  const map = useMap();
  const t = useTranslations("Calls");
  const { handleMarkerChange, handleMoveEnd } = useMarkerChange();

  const calls = useCall911State((state) => state.calls);

  const callsWithPosition = React.useMemo(() => {
    return calls.filter((v) => v.gtaMapPosition || (v.position?.lat && v.position.lng));
  }, [calls]);

  function handleToggle(callId: string) {
    const newOpenCalls = openCalls.includes(callId)
      ? openCalls.filter((v) => v !== callId)
      : [...openCalls, callId];

    setOpenCalls(newOpenCalls);
  }

  return (
    !hiddenItems[MapItem.CALLS] &&
    callsWithPosition.map((call) => {
      const callGtaPosition =
        call.gtaMapPosition && call.gtaMapPositionId
          ? convertToMap(call.gtaMapPosition.x, call.gtaMapPosition.y, map)
          : null;
      const callPosition = call.position as { lat: number; lng: number };
      const position = callGtaPosition ?? callPosition;

      return (
        <Marker
          eventHandlers={{
            moveend: (e) => handleMoveEnd(e, call),
          }}
          draggable
          key={call.id}
          position={position}
          icon={CALL_ICON}
        >
          <Tooltip direction="top">{t("dragToMoveCallBlip")}</Tooltip>

          <Popup minWidth={300}>
            <p style={{ margin: 2, fontSize: 18 }}>
              <strong>{t("location")}: </strong> {call.location}
            </p>
            <p style={{ margin: 2, fontSize: 18 }}>
              <strong>{t("caller")}: </strong> {call.name}
            </p>
            <div style={{ display: "inline-block", margin: 2, fontSize: 18 }}>
              <strong>{t("description")}: </strong> <CallDescription data={call} />
            </div>

            <div className="flex gap-2 mt-2">
              <Button size="xs" className="!text-base" onPress={() => handleToggle(call.id)}>
                {t("toggleCall")}
              </Button>
              <Button
                size="xs"
                variant="danger"
                className="!text-base"
                onPress={() => handleMarkerChange(call, "remove")}
              >
                {t("removeMarker")}
              </Button>
            </div>
          </Popup>
        </Marker>
      );
    })
  );
}
