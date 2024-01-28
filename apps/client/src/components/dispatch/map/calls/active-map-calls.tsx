import * as React from "react";
import { useTranslations } from "next-intl";
import type { Call911 } from "@snailycad/types";
import { useListener } from "@casperiv/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { CallItem } from "./call-item";
import { useCall911State } from "state/dispatch/call-911-state";
import { Accordion } from "@snailycad/ui";
import { useDispatchMapState } from "state/mapState";
import { useMarkerChange } from "./use-marker-change";

export function ActiveMapCalls() {
  const t = useTranslations("Calls");
  const calls911State = useCall911State();
  const { handleMarkerChange } = useMarkerChange();
  const { openCalls, setOpenCalls } = useDispatchMapState((state) => ({
    openCalls: state.openCalls,
    setOpenCalls: state.setOpenCalls,
  }));
  const callsWithPosition = React.useMemo(() => {
    return calls911State.calls.filter(
      (v) => v.gtaMapPosition || (v.position?.lat && v.position.lng),
    );
  }, [calls911State.calls]);

  useListener(
    SocketEvents.Create911Call,
    (data) => {
      calls911State.setCalls([data, ...calls911State.calls]);
    },
    [calls911State.calls],
  );

  useListener(
    SocketEvents.End911Call,
    (data: Call911) => {
      calls911State.setCalls(calls911State.calls.filter((v) => v.id !== data.id));
    },
    [calls911State.calls],
  );

  useListener(
    SocketEvents.Update911Call,
    (call) => {
      calls911State.setCalls(
        calls911State.calls.map((v) => {
          if (v.id === call.id) {
            calls911State.setCurrentlySelectedCall({ ...v, ...call });
            return { ...v, ...call };
          }

          return v;
        }),
      );
    },
    [calls911State.calls],
  );

  return (
    <div className="text-white overflow-y-auto">
      {calls911State.calls.length <= 0 ? (
        <p className="p-2">{t("no911Calls")}</p>
      ) : (
        <Accordion value={openCalls} onValueChange={setOpenCalls} type="multiple">
          {calls911State.calls.map((call) => {
            return (
              <CallItem
                hasMarker={(callId) => callsWithPosition.some((c) => c.id === callId)}
                setMarker={handleMarkerChange}
                key={call.id}
                call={call}
              />
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
