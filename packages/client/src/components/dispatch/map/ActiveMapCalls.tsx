import * as React from "react";
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

interface Props {
  hasMarker(callId: string): boolean;
  setMarker(call: Full911Call, type: "remove" | "set"): void;
}

export function ActiveMapCalls({ hasMarker, setMarker }: Props) {
  const [tempCall, setTempCall] = React.useState<Full911Call | null>(null);
  const t = useTranslations("Calls");
  const { calls, setCalls } = useDispatchState();

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
            return call;
          }

          return v;
        }),
      );
    },
    [calls, setCalls],
  );

  return (
    <div className="absolute z-20 p-3 bg-gray-300 rounded-md shadow top-6 left-4 dark:bg-dark-bg dark:text-white w-80">
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
    </div>
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

              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className={`${open ? "transform rotate-180" : ""} w-5 h-5 transition-transform`}
                viewBox="0 0 16 16"
              >
                <path d="M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z" />
              </svg>
            </Disclosure.Button>
            <Disclosure.Panel className="pt-2 text-base text-neutral-800 dark:text-white">
              <div className="map-column">
                <p id="caller">
                  <Span>{common("name")}:</Span> {call.name}
                </p>
                <p className="max-h-52 overflow-y-auto" id="description">
                  <Span>{common("description")}:</Span> {call.description}
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
