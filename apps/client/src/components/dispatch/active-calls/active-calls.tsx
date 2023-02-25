import * as React from "react";
import { Manage911CallModal } from "components/dispatch/modals/Manage911CallModal";
import { useRouter } from "next/router";
import { Full911Call, useDispatchState } from "state/dispatch/dispatch-state";
import { AssignedUnit, WhitelistStatus } from "@snailycad/types";
import { useTranslations } from "use-intl";
import useFetch from "lib/useFetch";
import { useLeoState } from "state/leo-state";
import { useEmsFdState } from "state/ems-fd-state";
import { DispatchCallTowModal } from "components/dispatch/modals/CallTowModal";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useCallsFilters } from "state/callsFiltersState";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import { FullDate } from "components/shared/FullDate";
import { classNames } from "lib/classNames";
import { usePermission } from "hooks/usePermission";
import { defaultPermissions } from "@snailycad/permissions";
import { Droppable } from "@snailycad/ui";
import { DndActions } from "types/DndActions";
import { AssignedUnitsColumn } from "./assigned-units-column";
import type { Get911CallsData, Post911CallAssignUnAssign } from "@snailycad/types/api";
import { useMounted } from "@casper124578/useful";
import { CallDescription } from "./CallDescription";
import { ActiveCallsHeader } from "./active-calls-header";
import { ActiveCallsActionsColumn } from "./actions-column";
import { useCall911State } from "state/dispatch/call-911-state";
import { useActiveCalls } from "hooks/realtime/use-active-calls";
import { shallow } from "zustand/shallow";
import { Status } from "components/shared/Status";

interface Props {
  initialData: Get911CallsData;
}

function _ActiveCalls({ initialData }: Props) {
  const { hasPermissions } = usePermission();
  const draggingUnit = useDispatchState((state) => state.draggingUnit);
  const call911State = useCall911State(
    (state) => ({
      calls: state.calls,
      setCalls: state.setCalls,
      currentlySelectedCall: state.currentlySelectedCall,
      setCurrentlySelectedCall: state.setCurrentlySelectedCall,
    }),
    shallow,
  );

  const isMounted = useMounted();
  const calls = isMounted ? call911State.calls : initialData.calls;
  const hasCalls = isMounted ? call911State.calls.length >= 1 : initialData.totalCount >= 1;

  const t = useTranslations("Calls");
  const leo = useTranslations("Leo");
  const common = useTranslations("Common");
  const router = useRouter();

  const { CALLS_911 } = useFeatureEnabled();
  const { execute } = useFetch();
  const activeOfficer = useLeoState((state) => state.activeOfficer);
  const activeDeputy = useEmsFdState((state) => state.activeDeputy);
  const search = useCallsFilters((state) => state.search);

  const asyncTable = useAsyncTable({
    search,
    disabled: !CALLS_911,
    fetchOptions: {
      pageSize: 12,
      requireFilterText: true,
      path: "/911-calls",
      onResponse: (json: Get911CallsData) => ({
        data: json.calls,
        totalCount: json.totalCount,
      }),
    },
    initialData: initialData.calls,
    totalCount: initialData.totalCount,
    scrollToTopOnDataChange: false,
  });

  React.useEffect(() => {
    call911State.setCalls(asyncTable.items);
  }, [asyncTable.items]); // eslint-disable-line react-hooks/exhaustive-deps

  const tableState = useTableState({
    defaultHiddenColumns: ["type", "priority"],
    tableId: "active-calls",
    pagination: asyncTable.pagination,
  });

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

  const { audio } = useActiveCalls({ calls, unit });
  const isUnitAssignedToCall = (call: Full911Call) =>
    call.assignedUnits.some((v) => v.unit?.id === unit?.id);

  async function handleAssignUnassignToCall(
    call: Full911Call,
    type: "assign" | "unassign",
    unitId = unit?.id,
  ) {
    const { json } = await execute<Post911CallAssignUnAssign>({
      path: `/911-calls/${type}/${call.id}`,
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

      call911State.setCalls(callsMapped);
    }
  }

  function handleUnassign({ unit, call }: { unit: AssignedUnit; call: Full911Call }) {
    handleAssignUnassignToCall(call, "unassign", unit.unit?.id);
  }

  const _calls = React.useMemo(() => {
    if (isDispatch) return calls;
    return calls.filter((call) => call.status === WhitelistStatus.ACCEPTED);
  }, [calls, isDispatch]);

  if (!CALLS_911) {
    return null;
  }

  return (
    <div className="rounded-md card">
      {audio.addedToCallAudio}
      {audio.incomingCallAudio}
      <ActiveCallsHeader asyncTable={asyncTable} calls={calls} />

      <div className="px-4">
        {!hasCalls ? (
          <p className="py-2 text-neutral-700 dark:text-gray-300">{t("no911Calls")}</p>
        ) : (
          <Table
            tableState={tableState}
            features={{ isWithinCardOrModal: true }}
            data={_calls.map((call) => {
              const isUnitAssigned = isMounted && isUnitAssignedToCall(call);

              return {
                id: call.id,
                rowProps: {
                  className: classNames(
                    isUnitAssigned && "bg-gray-200 dark:bg-amber-900",
                    call.isSignal100 && "bg-red-500 dark:bg-red-700",
                    // @ts-expect-error this is a socket extra type, it doesn't exist on the actual call
                    call.notifyAssignedUnits && "animate-call-updated",
                  ),
                },
                caseNumber: `#${call.caseNumber}`,
                type: call.type?.value.value ?? common("none"),
                priority: call.type?.priority ?? common("none"),
                status: <Status fallback="—">{call.status}</Status>,
                name: `${call.name} ${call.viaDispatch ? `(${leo("dispatch")})` : ""}`,
                location: `${call.location} ${call.postal ? `(${call.postal})` : ""}`,
                description: <CallDescription data={call} />,
                situationCode: call.situationCode?.value.value ?? common("none"),
                updatedAt: <FullDate>{call.updatedAt}</FullDate>,
                assignedUnits: (
                  <AssignedUnitsColumn
                    handleAssignToCall={(call, unitId) =>
                      handleAssignUnassignToCall(call, "assign", unitId)
                    }
                    call={call}
                    isDispatch={isDispatch}
                  />
                ),
                actions: (
                  <ActiveCallsActionsColumn
                    handleAssignUnassignToCall={handleAssignUnassignToCall}
                    isUnitAssigned={isUnitAssigned}
                    unit={unit}
                    call={call}
                  />
                ),
              };
            })}
            columns={[
              { header: "#", accessorKey: "caseNumber" },
              isDispatch ? { header: t("status"), accessorKey: "status" } : null,
              { header: t("caller"), accessorKey: "name" },
              { header: common("type"), accessorKey: "type" },
              { header: t("priority"), accessorKey: "priority" },
              { header: t("location"), accessorKey: "location" },
              { header: common("description"), accessorKey: "description" },
              { header: t("situationCode"), accessorKey: "situationCode" },
              { header: common("updatedAt"), accessorKey: "updatedAt" },
              { header: t("assignedUnits"), accessorKey: "assignedUnits" },
              { header: common("actions"), accessorKey: "actions" },
            ]}
          />
        )}
      </div>

      {isDispatch ? (
        <Droppable onDrop={handleUnassign} accepts={[DndActions.UnassignUnitFrom911Call]}>
          <div
            className={classNames(
              "grid place-items-center z-50 border-2 border-slate-500 bg-gray-400 dark:bg-quinary fixed bottom-3 left-3 right-4 h-60 shadow-sm rounded-md transition-opacity",
              draggingUnit === "call"
                ? "pointer-events-all opacity-100"
                : "pointer-events-none opacity-0",
            )}
          >
            <p>{t("dropToUnassign")}</p>
          </div>
        </Droppable>
      ) : null}

      <DispatchCallTowModal call={call911State.currentlySelectedCall} />
      <Manage911CallModal
        setCall={call911State.setCurrentlySelectedCall}
        onClose={() => call911State.setCurrentlySelectedCall(null)}
        call={call911State.currentlySelectedCall}
      />
    </div>
  );
}

export const ActiveCalls = React.memo(_ActiveCalls);
