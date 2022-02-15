import * as React from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Full911Call, useDispatchState } from "state/dispatchState";
import type { Call911 } from "@snailycad/types";
import { Manage911CallModal } from "components/modals/Manage911CallModal";
import { makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { ModalIds } from "types/ModalIds";
import { Disclosure } from "@headlessui/react";
import { Button } from "components/Button";
import { useModal } from "context/ModalContext";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { CaretDownFill } from "react-bootstrap-icons";
import { DescriptionModal } from "components/modal/DescriptionModal/DescriptionModal";
import { usePortal } from "@casper124578/useful";

interface Props {
  hasMarker(callId: string): boolean;
  setMarker(call: Full911Call, type: "remove" | "set"): void;
}

export function ActiveMapCalls({ hasMarker, setMarker }: Props) {
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
          <>
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
          </>
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

const Span = ({ children }: { children: React.ReactNode }) => (
  <span className="font-semibold">{children}</span>
);

interface CallItemProps extends Props {
  call: Full911Call;
  setTempCall: any;
}

function CallItem({ call, setTempCall, hasMarker, setMarker }: CallItemProps) {
  const t = useTranslations("Calls");
  const common = useTranslations("Common");
  const generateCallsign = useGenerateCallsign();
  const { openModal } = useModal();

  function handleEdit(call: Full911Call) {
    openModal(ModalIds.Manage911Call);
    setTempCall(call);
  }

  function handleViewDescription(call: Full911Call) {
    setTempCall(call);
    openModal(ModalIds.Description, call);
  }

  const assignedUnits = React.useMemo(() => {
    return call.assignedUnits.map((c, i) => {
      const comma = i !== call.assignedUnits.length - 1 ? ", " : " ";
      return (
        <span key={c.id}>
          {makeUnitName(c.unit)} {generateCallsign(c.unit)}
          {comma}
        </span>
      );
    });
  }, [call, generateCallsign]);

  return (
    <div title="Click to expand" className="p-2">
      <Disclosure>
        {({ open }) => (
          <>
            <Disclosure.Button className="flex justify-between w-full pt-1 text-lg font-semibold text-left">
              <p>
                {call.location} / {call.name}
              </p>

              <CaretDownFill
                width={16}
                height={16}
                className={`${open ? "transform rotate-180" : ""} w-5 h-5 transition-transform`}
              />
            </Disclosure.Button>
            <Disclosure.Panel className="pt-2 text-base text-neutral-800 dark:text-white">
              <div className="map-column">
                <p id="caller">
                  <Span>{common("name")}:</Span> {call.name}
                </p>
                <p className="max-h-52 overflow-y-auto" id="description">
                  <Span>{common("description")}:</Span>
                  {call.description && !call.descriptionData ? (
                    call.description
                  ) : (
                    <Button className="ml-2" small onClick={() => handleViewDescription(call)}>
                      {common("viewDescription")}
                    </Button>
                  )}
                </p>
                <p id="location">
                  <Span>{t("location")}:</Span> {call.location}
                </p>
                <p id="postal">
                  <Span>{t("postal")}: </Span>
                  {call.postal || common("none")}
                </p>
                <p id="assigned_unit">
                  <Span>{t("assignedUnits")}: </Span>
                  {assignedUnits.length <= 0 ? "None" : assignedUnits}
                </p>

                <div className="flex gap-2 mt-2">
                  <Button
                    data-bs-toggle="modal"
                    className="btn btn-success w-50"
                    onClick={() => handleEdit(call)}
                  >
                    {common("manage")}
                  </Button>

                  <Button onClick={() => setMarker(call, hasMarker(call.id) ? "remove" : "set")}>
                    {hasMarker(call.id) ? "Remove marker" : "Set marker"}
                  </Button>
                </div>
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    </div>
  );
}
