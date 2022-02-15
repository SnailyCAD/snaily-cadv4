import type { LeafletEvent } from "leaflet";
import useFetch from "lib/useFetch";
import { Marker, Popup } from "react-leaflet";
import { Full911Call, useDispatchState } from "state/dispatchState";

export function RenderActiveCalls() {
  const { calls, setCalls } = useDispatchState();
  const { execute } = useFetch();

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
      {calls.map((call) => {
        if (!call.position) return;
        if (!call.position.lng || !call.position.lat) return;

        return (
          <Marker
            eventHandlers={{
              moveend: (e) => handleMoveEnd(e, call),
            }}
            draggable
            key={call.id}
            position={{ lat: call.position.lat, lng: call.position.lng }}
          >
            <Popup>
              <div style={{ minWidth: 250 }}>
                <div className="d-flex flex-column">
                  <p style={{ margin: 2, fontSize: 16 }}>
                    <strong>Location: </strong> ${call.location}
                  </p>
                  <p style={{ margin: 2, fontSize: 16 }}>
                    <strong>Caller: </strong> ${call.name}
                  </p>
                  <p style={{ margin: 2, fontSize: 16 }}>
                    <strong>Description: </strong> ${call.description}
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
