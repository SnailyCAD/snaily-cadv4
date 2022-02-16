import * as React from "react";
import { Root as AccordionRoot } from "@radix-ui/react-accordion";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Full911Call, useDispatchState } from "state/dispatchState";
import type { Call911 } from "@snailycad/types";
import { Manage911CallModal } from "components/modals/Manage911CallModal";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { DescriptionModal } from "components/modal/DescriptionModal/DescriptionModal";
import { usePortal } from "@casper124578/useful";
import { CallItem } from "./CallItem";

export interface MapCallProps {
  hasMarker(callId: string): boolean;
  setMarker(call: Full911Call, type: "remove" | "set"): void;
  openItems: string[];
  setOpenItems: React.Dispatch<React.SetStateAction<string[]>>;
}

export function ActiveMapCalls({ hasMarker, setOpenItems, openItems, setMarker }: MapCallProps) {
  const [tempCall, setTempCall] = React.useState<Full911Call | null>(null);

  const t = useTranslations("Calls");
  const { calls, setCalls } = useDispatchState();
  const portalRef = usePortal("ActiveMapCalls");

  useListener(
    SocketEvents.Create911Call,
    (data) => {
      setCalls([data, ...calls]);
    },
    [calls, setCalls],
  );

  useListener(
    SocketEvents.End911Call,
    (data: Call911) => {
      setCalls(calls.filter((v) => v.id !== data.id));
    },
    [calls, setCalls],
  );

  useListener(
    SocketEvents.Update911Call,
    (call) => {
      setCalls(
        calls.map((v) => {
          if (v.id === call.id) {
            setTempCall({ ...v, ...call });
            return { ...v, ...call };
          }

          return v;
        }),
      );
    },
    [calls, setCalls],
  );

  return (
    portalRef &&
    createPortal(
      <div
        id="map-calls"
        className="pointer-events-all absolute z-50 p-3 bg-gray-300 rounded-md shadow top-20 left-4 dark:bg-dark-bg dark:text-white w-80"
      >
        <h1 className="text-xl font-semibold">{t("active911Calls")}</h1>
        {calls.length <= 0 ? (
          <p>{t("no911Calls")}</p>
        ) : (
          <AccordionRoot value={openItems} onValueChange={setOpenItems} type="multiple">
            {calls.map((call) => {
              return (
                <CallItem
                  setTempCall={setTempCall}
                  hasMarker={hasMarker}
                  setMarker={setMarker}
                  key={call.id}
                  call={call}
                />
              );
            })}
          </AccordionRoot>
        )}

        <Manage911CallModal onClose={() => setTempCall(null)} call={tempCall} />
        <DescriptionModal
          onClose={() => setTempCall(null)}
          value={tempCall?.descriptionData ?? undefined}
        />
      </div>,
      portalRef,
    )
  );
}
