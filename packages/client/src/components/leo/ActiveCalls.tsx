import * as React from "react";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { Button } from "components/Button";
import { Manage911CallModal } from "components/modals/Manage911CallModal";
import { useAuth } from "context/AuthContext";
import format from "date-fns/format";
import { useRouter } from "next/router";
import { Full911Call, useDispatchState } from "state/dispatchState";
import { AssignedUnit, Call911 } from "types/prisma";
import { useTranslations } from "use-intl";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import dynamic from "next/dynamic";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import useFetch from "lib/useFetch";
import { useLeoState } from "state/leoState";
import { useEmsFdState } from "state/emsFdState";
import { makeUnitName } from "lib/utils";
import { DispatchCallTowModal } from "components/dispatch/modals/CallTowModal";
import compareDesc from "date-fns/compareDesc";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useActiveDispatchers } from "hooks/realtime/useActiveDispatchers";

const DescriptionModal = dynamic(
  async () => (await import("components/modal/DescriptionModal/DescriptionModal")).DescriptionModal,
);

const CallEventsModal = dynamic(
  async () => (await import("components/modals/CallEventsModal")).CallEventsModal,
);

export function ActiveCalls() {
  const { hasActiveDispatchers } = useActiveDispatchers();
  const [tempCall, setTempCall] = React.useState<Full911Call | null>(null);

  const { calls, setCalls } = useDispatchState();
  const t = useTranslations("Calls");
  const common = useTranslations("Common");
  const { user } = useAuth();
  const router = useRouter();
  const isDispatch = router.pathname === "/dispatch" && user?.isDispatch;
  const { openModal } = useModal();
  const generateCallsign = useGenerateCallsign();
  const { execute } = useFetch();
  const { activeOfficer } = useLeoState();
  const { activeDeputy } = useEmsFdState();
  const { TOW, CALLS_911 } = useFeatureEnabled();

  const unit =
    router.pathname === "/officer"
      ? activeOfficer
      : router.pathname === "/ems-fd"
      ? activeDeputy
      : null;

  const isUnitAssignedToCall = (call: Full911Call) =>
    call.assignedUnits.some((v) => v.unit.id === unit?.id);

  const makeUnit = (unit: AssignedUnit) =>
    "officers" in unit.unit
      ? unit.unit.callsign
      : `${generateCallsign(unit.unit)} ${makeUnitName(unit.unit)}`;

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

  function handleManageClick(call: Full911Call) {
    setTempCall(call);
    openModal(ModalIds.Manage911Call, call);
  }

  function handleViewDescription(call: Full911Call) {
    setTempCall(call);
    openModal(ModalIds.Description, call);
  }

  function handleCallTow(call: Full911Call) {
    if (!TOW) return;
    setTempCall(call);
    openModal(ModalIds.ManageTowCall, { call911Id: call.id });
  }

  async function handleAssignToCall(call: Full911Call) {
    await execute(`/911-calls/assign-to/${call.id}`, {
      method: "POST",
      data: { unit: unit?.id },
    });
  }

  if (!CALLS_911) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-md card">
      <header className="p-2 px-4 bg-gray-300/50 dark:bg-gray-3">
        <h3 className="text-xl font-semibold">{t("active911Calls")}</h3>
      </header>

      <div className="px-4">
        {calls.length <= 0 ? (
          <p className="py-2">{t("no911Calls")}</p>
        ) : (
          <div className="w-full my-3 overflow-x-auto max-h-80">
            <table className="w-full overflow-hidden whitespace-nowrap">
              <thead className="sticky top-0">
                <tr>
                  <th className="bg-gray-300">{t("caller")}</th>
                  <th className="bg-gray-300">{t("location")}</th>
                  <th className="bg-gray-300">{common("description")}</th>
                  <th className="bg-gray-300">{common("updatedAt")}</th>
                  <th className="bg-gray-300">{t("postal")}</th>
                  <th className="bg-gray-300">{t("assignedUnits")}</th>
                  <th className="bg-gray-300">{common("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {calls
                  .sort((a, b) => compareDesc(new Date(a.updatedAt), new Date(b.updatedAt)))
                  .map((call) => {
                    const isUnitAssigned = isUnitAssignedToCall(call);

                    return (
                      <tr
                        className={isUnitAssigned ? "bg-gray-200 dark:bg-gray-3" : ""}
                        key={call.id}
                      >
                        <td>{call.name}</td>
                        <td>{call.location}</td>
                        <td className="max-w-4xl text-base min-w-[250px] break-words whitespace-pre-wrap">
                          {call.description && !call.descriptionData ? (
                            call.description
                          ) : (
                            <Button
                              disabled={isDispatch ? false : !unit}
                              small
                              onClick={() => handleViewDescription(call)}
                            >
                              {common("viewDescription")}
                            </Button>
                          )}
                        </td>
                        <td>{format(new Date(call.updatedAt), "HH:mm:ss - yyyy-MM-dd")}</td>
                        <td>{call.postal || common("none")}</td>
                        <td>{call.assignedUnits.map(makeUnit).join(", ") || common("none")}</td>
                        <td>
                          {isDispatch ? (
                            <>
                              <Button
                                disabled={!hasActiveDispatchers}
                                small
                                variant="success"
                                onClick={() => handleManageClick(call)}
                              >
                                {common("manage")}
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                disabled={!unit}
                                small
                                onClick={() => handleManageClick(call)}
                              >
                                {t("viewEvents")}
                              </Button>
                              {isUnitAssigned ? null : (
                                <Button
                                  className="ml-2"
                                  disabled={!unit}
                                  small
                                  onClick={() => handleAssignToCall(call)}
                                >
                                  {t("assignToCall")}
                                </Button>
                              )}
                            </>
                          )}

                          {TOW ? (
                            <Button
                              disabled={!hasActiveDispatchers || (!isDispatch && !unit)}
                              small
                              className="ml-2"
                              onClick={() => handleCallTow(call)}
                            >
                              {t("callTow")}
                            </Button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DispatchCallTowModal call={tempCall} />
      {tempCall?.descriptionData ? (
        <DescriptionModal onClose={() => setTempCall(null)} value={tempCall.descriptionData} />
      ) : null}

      {isDispatch ? (
        <Manage911CallModal
          setCall={setTempCall}
          onClose={() => setTempCall(null)}
          call={tempCall}
        />
      ) : (
        <CallEventsModal onClose={() => setTempCall(null)} call={tempCall} />
      )}
    </div>
  );
}
