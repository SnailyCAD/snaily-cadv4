import * as React from "react";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { Button } from "components/Button";
import { Manage911CallModal } from "components/dispatch/modals/Manage911CallModal";
import { useRouter } from "next/router";
import { Full911Call, useDispatchState } from "state/dispatchState";
import { AssignedUnit, Call911, ShouldDoType } from "@snailycad/types";
import { useTranslations } from "use-intl";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import dynamic from "next/dynamic";
import useFetch from "lib/useFetch";
import { useLeoState } from "state/leoState";
import { useEmsFdState } from "state/emsFdState";
import { DispatchCallTowModal } from "components/dispatch/modals/CallTowModal";
import compareDesc from "date-fns/compareDesc";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useActiveDispatchers } from "hooks/realtime/useActiveDispatchers";
import { CallsFilters, useActiveCallsFilters } from "./calls/CallsFilters";
import { useCallsFilters } from "state/callsFiltersState";
import { Filter } from "react-bootstrap-icons";
import { Table } from "components/shared/Table";
import { FullDate } from "components/shared/FullDate";
import { classNames } from "lib/classNames";
import { usePermission } from "hooks/usePermission";
import { defaultPermissions } from "@snailycad/permissions";
import { useAudio } from "react-use";
import { useAuth } from "context/AuthContext";
import { Droppable } from "components/shared/dnd/Droppable";
import { DndActions } from "types/DndActions";
import { AssignedUnitsColumn } from "./active-calls/AssignedUnitsColumn";

const ADDED_TO_CALL_SRC = "/sounds/added-to-call.mp3" as const;
const INCOMING_CALL_SRC = "/sounds/incoming-call.mp3" as const;

const DescriptionModal = dynamic(
  async () => (await import("components/modal/DescriptionModal/DescriptionModal")).DescriptionModal,
);

function _ActiveCalls() {
  const { user } = useAuth();
  const { hasActiveDispatchers } = useActiveDispatchers();

  const [tempCall, setTempCall] = React.useState<Full911Call | null>(null);

  const { hasPermissions } = usePermission();
  const { calls, setCalls, draggingUnit } = useDispatchState();
  const t = useTranslations("Calls");
  const leo = useTranslations("Leo");
  const common = useTranslations("Common");
  const router = useRouter();

  const shouldPlayAddedToCallSound = user?.soundSettings?.addedToCall ?? false;
  const shouldPlayIncomingCallSound = user?.soundSettings?.incomingCall ?? false;

  const [addedToCallAudio, , addedToCallControls] = useAudio({
    autoPlay: false,
    src: ADDED_TO_CALL_SRC,
  });

  const [incomingCallAudio, , incomingCallControls] = useAudio({
    autoPlay: false,
    src: INCOMING_CALL_SRC,
  });

  const { openModal } = useModal();
  const { execute } = useFetch();
  const { activeOfficer } = useLeoState();
  const { activeDeputy } = useEmsFdState();
  const { TOW, CALLS_911 } = useFeatureEnabled();
  const { setShowFilters, showFilters, search } = useCallsFilters();
  const handleCallsFilter = useActiveCallsFilters();

  const hasDispatchPermissions = hasPermissions(
    defaultPermissions.defaultDispatchPermissions,
    (u) => u.isDispatch,
  );
  const isDispatch = router.pathname === "/dispatch" && hasDispatchPermissions;
  const unit =
    router.pathname === "/officer"
      ? activeOfficer
      : router.pathname === "/ems-fd"
      ? activeDeputy
      : null;

  const isUnitActive = unit?.status && unit.status.shouldDo !== ShouldDoType.SET_OFF_DUTY;

  const isUnitAssignedToCall = (call: Full911Call) =>
    call.assignedUnits.some((v) => v.unit?.id === unit?.id);

  useListener(
    SocketEvents.Create911Call,
    (call: Full911Call | null) => {
      if (!call) return;
      if (calls.some((v) => v.id === call.id)) return;

      const wasAssignedToCall = call.assignedUnits.some((v) => v.unit?.id === unit?.id);

      if (shouldPlayIncomingCallSound) {
        incomingCallControls.seek(0);
        incomingCallControls.volume(0.3);
        incomingCallControls.play();
      }

      if (wasAssignedToCall && shouldPlayAddedToCallSound) {
        addedToCallControls.seek(0);
        addedToCallControls.volume(0.3);
        addedToCallControls.play();
      }

      setCalls([call, ...calls]);
    },
    [
      calls,
      setCalls,
      shouldPlayAddedToCallSound,
      shouldPlayIncomingCallSound,
      addedToCallControls,
      incomingCallControls,
      unit?.id,
    ],
  );

  useListener(
    SocketEvents.End911Call,
    (data: Call911 | undefined) => {
      if (!data) return;
      setCalls(calls.filter((v) => v.id !== data.id));
    },
    [calls, setCalls],
  );

  useListener(
    SocketEvents.Update911Call,
    (call: Full911Call | undefined) => {
      if (!call) return;

      const prevCall = calls.find((v) => v.id === call.id);
      if (prevCall) {
        const wasAssignedToCall =
          !prevCall.assignedUnits.some((u) => u.unit?.id === unit?.id) &&
          call.assignedUnits.some((v) => v.unit?.id === unit?.id);

        if (wasAssignedToCall && shouldPlayAddedToCallSound) {
          addedToCallControls.seek(0);
          addedToCallControls.volume(0.3);
          addedToCallControls.play();
        } else {
          addedToCallControls.pause();
        }
      }

      setCalls(
        calls.map((v) => {
          if (v.id === call.id) {
            if (tempCall?.id === call.id) {
              setTempCall({ ...v, ...call });
            }

            return { ...v, ...call };
          }

          return v;
        }),
      );
    },
    [calls, unit?.id, addedToCallControls, shouldPlayAddedToCallSound, setCalls],
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

  async function handleAssignToCall(call: Full911Call, unitId = unit?.id) {
    const { json } = await execute(`/911-calls/assign/${call.id}`, {
      method: "POST",
      data: { unit: unitId },
    });

    if (json.id) {
      const callsMapped = calls.map((call) => {
        if (call.id === json.id) {
          return { ...call, ...json };
        }

        return call;
      });

      setCalls(callsMapped);
    }
  }

  async function handleUnassignFromCall(call: Full911Call, unitId = unit?.id) {
    const { json } = await execute(`/911-calls/unassign/${call.id}`, {
      method: "POST",
      data: { unit: unitId },
    });

    if (json.id) {
      const callsMapped = calls.map((call) => {
        if (call.id === json.id) {
          return { ...call, ...json };
        }

        return call;
      });

      setCalls(callsMapped);
    }
  }

  function handleUnassign({ unit, call }: { unit: AssignedUnit; call: Full911Call }) {
    handleUnassignFromCall(call, unit.unit.id);
  }

  if (!CALLS_911) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-md card">
      {addedToCallAudio}
      {incomingCallAudio}
      <header className="flex items-center justify-between p-2 px-4 bg-gray-200 dark:bg-gray-3">
        <h3 className="text-xl font-semibold">{t("active911Calls")}</h3>

        <div>
          <Button
            variant="cancel"
            className={classNames(
              "px-1.5 hover:bg-gray-500 dark:hover:bg-dark-bg group",
              showFilters && "dark:!bg-dark-bg !bg-gray-500",
            )}
            onClick={() => setShowFilters(!showFilters)}
            title={t("callFilters")}
            disabled={calls.length <= 0}
          >
            <Filter
              className={classNames("group-hover:fill-white", showFilters && "text-white")}
              aria-label={t("callFilters")}
            />
          </Button>
        </div>
      </header>
      <div className="px-4">
        <CallsFilters calls={calls} />

        {calls.length <= 0 ? (
          <p className="py-2 text-neutral-700 dark:text-gray-300">{t("no911Calls")}</p>
        ) : (
          <Table
            isWithinCard
            filter={search}
            data={calls
              .sort((a, b) => compareDesc(new Date(a.updatedAt), new Date(b.updatedAt)))
              .filter(handleCallsFilter)
              .map((call) => {
                const isUnitAssigned = isUnitAssignedToCall(call);

                return {
                  rowProps: {
                    className: isUnitAssigned ? "bg-gray-200 dark:bg-[#333639]" : undefined,
                  },
                  caseNumber: `#${call.caseNumber}`,
                  name: `${call.name} ${call.viaDispatch ? `(${leo("dispatch")})` : ""}`,
                  location: `${call.location} ${call.postal ? `(${call.postal})` : ""}`,
                  description:
                    call.description && !call.descriptionData ? (
                      <span className="max-w-4xl text-base min-w-[250px] break-words whitespace-pre-wrap">
                        {call.description}
                      </span>
                    ) : (
                      <Button
                        disabled={isDispatch ? false : !isUnitActive}
                        size="xs"
                        onClick={() => handleViewDescription(call)}
                      >
                        {common("viewDescription")}
                      </Button>
                    ),
                  situationCode: call.situationCode?.value.value ?? common("none"),
                  updatedAt: <FullDate>{call.updatedAt}</FullDate>,
                  assignedUnits: (
                    <AssignedUnitsColumn
                      handleAssignToCall={handleAssignToCall}
                      call={call}
                      isDispatch={isDispatch}
                    />
                  ),
                  actions: (
                    <>
                      <Button
                        disabled={isDispatch ? !hasActiveDispatchers : !isUnitActive}
                        size="xs"
                        variant="success"
                        onClick={() => handleManageClick(call)}
                      >
                        {isDispatch ? common("manage") : common("view")}
                      </Button>

                      {isDispatch ? null : isUnitAssigned ? (
                        <Button
                          className="ml-2"
                          disabled={!isUnitActive}
                          size="xs"
                          onClick={() => handleUnassignFromCall(call)}
                        >
                          {t("unassignFromCall")}
                        </Button>
                      ) : (
                        <Button
                          className="ml-2"
                          disabled={!isUnitActive}
                          size="xs"
                          onClick={() => handleAssignToCall(call)}
                        >
                          {t("assignToCall")}
                        </Button>
                      )}

                      {TOW ? (
                        <Button
                          disabled={isDispatch ? !hasActiveDispatchers : !isUnitActive}
                          size="xs"
                          className="ml-2"
                          onClick={() => handleCallTow(call)}
                        >
                          {t("callTow")}
                        </Button>
                      ) : null}
                    </>
                  ),
                };
              })}
            columns={[
              { Header: "#", accessor: "caseNumber" },
              { Header: t("caller"), accessor: "name" },
              { Header: t("location"), accessor: "location" },
              { Header: common("description"), accessor: "description" },
              { Header: t("situationCode"), accessor: "situationCode" },
              { Header: common("updatedAt"), accessor: "updatedAt" },
              { Header: t("assignedUnits"), accessor: "assignedUnits" },
              { Header: common("actions"), accessor: "actions" },
            ]}
          />
        )}
      </div>

      {isDispatch ? (
        <Droppable onDrop={handleUnassign} accepts={[DndActions.UnassignUnitFrom911Call]}>
          <div
            className={classNames(
              "grid place-items-center z-50 border-2 border-slate-500 bg-gray-4 fixed bottom-3 left-3 right-4 h-60 shadow-sm rounded-md transition-opacity",
              draggingUnit === "call"
                ? "pointer-events-all opacity-100"
                : "pointer-events-none opacity-0",
            )}
          >
            <p>{t("dropToUnassign")}</p>
          </div>
        </Droppable>
      ) : null}

      <DispatchCallTowModal call={tempCall} />
      {tempCall?.descriptionData ? (
        <DescriptionModal onClose={() => setTempCall(null)} value={tempCall.descriptionData} />
      ) : null}

      <Manage911CallModal setCall={setTempCall} onClose={() => setTempCall(null)} call={tempCall} />
    </div>
  );
}

export const ActiveCalls = React.memo(_ActiveCalls);
