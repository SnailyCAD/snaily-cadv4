import * as React from "react";
import type { LeafletEvent } from "leaflet";
import useFetch from "lib/useFetch";
import { Marker, Popup, useMap } from "react-leaflet";
import { Full911Call, useDispatchState } from "state/dispatchState";
import { ActiveMapCalls } from "./ActiveMapCalls";
import { convertToMap } from "lib/map/utils";
import { Button } from "components/Button";
import { useTranslations } from "next-intl";

export function RenderActiveCalls() {
  const map = useMap();
  const { execute } = useFetch();
  const { calls, setCalls } = useDispatchState();
  const common = useTranslations("Common");

  const callsWithPosition = React.useMemo(() => {
    return calls.filter((v) => v.position?.lat && v.position.lng);
  }, [calls]);

  function handleCallUpdate(callId: string, data: Full911Call) {
    const prevIdx = calls.findIndex((v) => v.id === callId);
    if (prevIdx !== -1) {
      calls[prevIdx] = data;
    }

    setCalls(calls);
  }

  async function handleMoveEnd(e: LeafletEvent, call: Full911Call) {
    const latLng = e.target._latlng;
    const data = { ...call, position: { id: call.positionId ?? "", ...latLng } };

    handleCallUpdate(call.id, { ...data });

    const { json } = await execute(`/911-calls/${call.id}`, {
      method: "PUT",
      data,
    });

    handleCallUpdate(call.id, { ...data, ...json });
  }

  return (
    <>
      {callsWithPosition.map((call) => {
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
            <Popup>
              <div style={{ minWidth: 300 }}>
                <div className="d-flex flex-column">
                  <p style={{ margin: 2, fontSize: 18 }}>
                    <strong>Location: </strong> {call.location}
                  </p>
                  <p style={{ margin: 2, fontSize: 18 }}>
                    <strong>Caller: </strong> {call.name}
                  </p>
                  <p style={{ margin: 2, fontSize: 18 }}>
                    <strong>{common("description")}: </strong>
                    {call.description && !call.descriptionData ? (
                      call.description
                    ) : (
                      // todo: onClick={() => handleViewDescription(call)}
                      <Button className="ml-2" small>
                        {common("viewDescription")}
                      </Button>
                    )}
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* <ActiveMapUnits /> */}
      <ActiveMapCalls
        hasMarker={(callId: string) => {
          return callsWithPosition.some((v) => v.id === callId);
        }}
        setMarker={(call: Full911Call, type: "remove" | "set") => {
          // const marker = this.state.MarkerStore.some((m) => m.payload.call?.id === call.id);
          const marker = callsWithPosition.some((v) => v.id === call.id);

          // if (type === "set") {
          //   this.handleCalls();
          // }

          // if (marker && type === "remove") {
          //   this.remove911Call(call.id);
          // }

          const coords = convertToMap(0, 0, map);

          // todo
          // this.props.update911Call({
          //   ...call,
          //   position: type === "remove" ? null : { id: "", ...coords },
          // });
        }}
      />
    </>
  );
}
