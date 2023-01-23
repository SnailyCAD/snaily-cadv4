import * as React from "react";
import { icon as leafletIcon, LeafletEvent } from "leaflet";
import useFetch from "lib/useFetch";
import { Marker, Popup, Tooltip, useMap } from "react-leaflet";
import type { Full911Call } from "state/dispatch/dispatch-state";
import { ActiveMapCalls } from "./ActiveMapCalls";
import { convertToMap } from "lib/map/utils";
import { Button } from "@snailycad/ui";
import { useTranslations } from "next-intl";
import type { Put911CallByIdData } from "@snailycad/types/api";
import { useCall911State } from "state/dispatch/call-911-state";
import { CallDescription } from "components/dispatch/active-calls/CallDescription";
import { MapItem, useDispatchMapState } from "state/mapState";
import { shallow } from "zustand/shallow";

const CALL_ICON_SIZE = 30;

const CALL_ICON = leafletIcon({
  iconUrl: "/map/call.png",
  iconSize: [CALL_ICON_SIZE, CALL_ICON_SIZE],
  popupAnchor: [0, -CALL_ICON_SIZE / 2],
  iconAnchor: [CALL_ICON_SIZE / 2, CALL_ICON_SIZE / 2],
  tooltipAnchor: [0, -CALL_ICON_SIZE / 2],
});

export function RenderActiveCalls() {
  const map = useMap();
  const { execute } = useFetch();
  const { setCalls, calls } = useCall911State(
    (state) => ({
      setCalls: state.setCalls,
      calls: state.calls,
    }),
    shallow,
  );

  const t = useTranslations("Calls");
  const [openItems, setOpenItems] = React.useState<string[]>([]);
  const { hiddenItems } = useDispatchMapState();

  const callsWithPosition = React.useMemo(() => {
    return calls.filter((v) => v.gtaMapPosition || (v.position?.lat && v.position.lng));
  }, [calls]);

  function handleCallStateUpdate(callId: string, data: Full911Call) {
    const prevIdx = calls.findIndex((v) => v.id === callId);
    if (prevIdx !== -1) {
      calls[prevIdx] = data;
    }

    setCalls(calls);
  }

  async function handleMoveEnd(e: LeafletEvent, call: Full911Call) {
    const latLng = e.target._latlng;
    const data = {
      ...call,
      position: { id: call.positionId ?? "", ...latLng },
    };

    handleCallStateUpdate(call.id, { ...data });

    const { json } = await execute<Put911CallByIdData>({
      path: `/911-calls/${call.id}`,
      method: "PUT",
      data: {
        position: data.position,
      },
    });

    handleCallStateUpdate(call.id, { ...data, ...json });
  }

  async function handleMarkerChange(call: Full911Call, type: "remove" | "set") {
    const index = calls.findIndex((v) => v.id === call.id);
    const coords = convertToMap(150 * index, 0, map);

    const callData =
      type === "set"
        ? { ...call, position: { ...coords, id: "null" } }
        : { ...call, position: null };

    handleCallStateUpdate(call.id, callData);

    const { json } = await execute<Put911CallByIdData>({
      path: `/911-calls/${call.id}`,
      method: "PUT",
      data: {
        position: callData.position,
      },
    });

    handleCallStateUpdate(call.id, { ...callData, ...json });
  }

  function handleToggle(callId: string) {
    setOpenItems((p) => {
      if (p.includes(callId)) {
        return p.filter((v) => v !== callId);
      }

      return [...p, callId];
    });
  }

  return (
    <>
      {!hiddenItems[MapItem.CALLS] &&
        callsWithPosition.map((call) => {
          const callGtaPosition = call.gtaMapPosition
            ? convertToMap(call.gtaMapPosition.x, call.gtaMapPosition.y, map)
            : null;
          const callPosition = call.position as { lat: number; lng: number };
          const position = callGtaPosition ?? callPosition;

          return (
            <Marker
              eventHandlers={{
                moveend: (e) => handleMoveEnd(e, call),
              }}
              // must be managed by in-game updates
              draggable={!call.gtaMapPosition}
              key={call.id}
              position={position}
              icon={CALL_ICON}
            >
              {!call.gtaMapPosition ? (
                <Tooltip direction="top">{t("dragToMoveCallBlip")}</Tooltip>
              ) : null}

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
        })}

      <ActiveMapCalls
        openItems={openItems}
        setOpenItems={setOpenItems}
        hasMarker={(callId: string) => {
          return callsWithPosition.some((v) => v.id === callId);
        }}
        setMarker={handleMarkerChange}
      />
    </>
  );
}
