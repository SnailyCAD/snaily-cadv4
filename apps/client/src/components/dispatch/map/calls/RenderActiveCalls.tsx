import * as React from "react";
import type { LeafletEvent } from "leaflet";
import useFetch from "lib/useFetch";
import { Marker, Popup, useMap } from "react-leaflet";
import type { Full911Call } from "state/dispatch/dispatchState";
import { ActiveMapCalls } from "./ActiveMapCalls";
import { convertToMap } from "lib/map/utils";
import { Button } from "@snailycad/ui";
import { useTranslations } from "next-intl";
import type { Put911CallByIdData } from "@snailycad/types/api";
import { useCall911State } from "state/dispatch/call911State";
import { CallDescription } from "components/dispatch/active-calls/CallDescription";
import { MapItem, useDispatchMapState } from "state/mapState";

export function RenderActiveCalls() {
  const map = useMap();
  const { execute } = useFetch();
  const { calls, setCalls } = useCall911State();
  const t = useTranslations("Calls");
  const [openItems, setOpenItems] = React.useState<string[]>([]);
  const { hiddenItems } = useDispatchMapState();

  const callsWithPosition = calls.filter((v) => v.position?.lat && v.position.lng);

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
        ...data,
        situationCode: call.situationCodeId,
        divisions: undefined,
        departments: undefined,
        assignedUnits: undefined,
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
        ...callData,
        situationCode: call.situationCodeId,
        divisions: undefined,
        departments: undefined,
        assignedUnits: undefined,
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
          const position = call.position as { lat: number; lng: number };

          return (
            <Marker
              eventHandlers={{
                moveend: (e) => handleMoveEnd(e, call),
              }}
              draggable
              key={call.id}
              position={position}
            >
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
