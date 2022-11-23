import type * as React from "react";
import { Root as AccordionRoot } from "@radix-ui/react-accordion";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import type { Full911Call } from "state/dispatch/dispatch-state";
import type { Call911 } from "@snailycad/types";
import { Manage911CallModal } from "components/dispatch/modals/Manage911CallModal";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { usePortal } from "@casper124578/useful";
import { CallItem } from "./CallItem";
import { useCall911State } from "state/dispatch/call-911-state";

export interface MapCallProps {
  hasMarker(callId: string): boolean;
  setMarker(call: Full911Call, type: "remove" | "set"): void;
  openItems: string[];
  setOpenItems: React.Dispatch<React.SetStateAction<string[]>>;
}

export function ActiveMapCalls({ hasMarker, setOpenItems, openItems, setMarker }: MapCallProps) {
  const t = useTranslations("Calls");
  const calls911State = useCall911State();
  const portalRef = usePortal("ActiveMapCalls");

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
    portalRef &&
    createPortal(
      <div
        id="map-calls"
        className="fixed z-[29] p-3 max-h-[88vh] thin-scrollbar top-20 left-4 w-80 rounded-md shadow bg-gray-50 dark:bg-tertiary dark:border dark:border-secondary dark:text-white overflow-y-auto"
      >
        <h1 className="text-xl font-semibold">{t("active911Calls")}</h1>
        {calls911State.calls.length <= 0 ? (
          <p>{t("no911Calls")}</p>
        ) : (
          <AccordionRoot value={openItems} onValueChange={setOpenItems} type="multiple">
            {calls911State.calls.map((call) => {
              return (
                <CallItem hasMarker={hasMarker} setMarker={setMarker} key={call.id} call={call} />
              );
            })}
          </AccordionRoot>
        )}

        <Manage911CallModal
          onClose={() => calls911State.setCurrentlySelectedCall(null)}
          call={calls911State.currentlySelectedCall}
        />
      </div>,
      portalRef,
    )
  );
}
