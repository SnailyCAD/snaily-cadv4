import * as React from "react";
import { Manage911CallModal } from "components/dispatch/modals/Manage911CallModal";
import { useRouter } from "next/router";
import { Full911Call, useDispatchState } from "state/dispatch/dispatchState";
import type { AssignedUnit } from "@snailycad/types";
import { useTranslations } from "use-intl";
import useFetch from "lib/useFetch";
import { useLeoState } from "state/leoState";
import { useEmsFdState } from "state/emsFdState";
import { DispatchCallTowModal } from "components/dispatch/modals/CallTowModal";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useCallsFilters } from "state/callsFiltersState";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import { FullDate } from "components/shared/FullDate";
import { classNames } from "lib/classNames";
import { usePermission } from "hooks/usePermission";
import { defaultPermissions } from "@snailycad/permissions";
import { Droppable } from "components/shared/dnd/Droppable";
import { DndActions } from "types/DndActions";
import { AssignedUnitsColumn } from "./AssignedUnitsColumn";
import type { Get911CallsData, Post911CallAssignUnAssign } from "@snailycad/types/api";
import { useMounted } from "@casper124578/useful";
import { CallDescription } from "./CallDescription";
import { ActiveCallsHeader } from "./ActiveCallsHeader";
import { ActiveCallsActionsColumn } from "./ActionsColumn";
import { useCall911State } from "state/dispatch/call911State";
import { useActiveCalls } from "hooks/realtime/useActiveCalls";

interface Props {
  initialData: Get911CallsData;
}

function _ActiveCalls({ initialData }: Props) {
  const { hasPermissions } = usePermission();
  const { draggingUnit } = useDispatchState();
  const call911State = useCall911State();
  const isMounted = useMounted();
  const calls = isMounted ? call911State.calls : initialData.calls;
  const hasCalls = isMounted ? call911State.calls.length >= 1 : initialData.totalCount >= 1;

  const t = useTranslations("Calls");
  const leo = useTranslations("Leo");
  const common = useTranslations("Common");
  const router = useRouter();

  const { CALLS_911 } = useFeatureEnabled();
  const { execute } = useFetch();
  const { activeOfficer } = useLeoState();
  const { activeDeputy } = useEmsFdState();
  const { search, setSearch } = useCallsFilters();

  const asyncTable = useAsyncTable({
    disabled: !CALLS_911,
    fetchOptions: {
      path: "/911-calls",
      onResponse: (json: Get911CallsData) => ({
        data: json.calls,
        totalCount: json.totalCount,
      }),
    },
    initialData: initialData.calls,
    totalCount: initialData.totalCount,
    scrollToTopOnDataChange: false,
    state: { data: calls, setData: call911State.setCalls },
  });

  const tableState = useTableState({
    pagination: { ...asyncTable.pagination, pageSize: 12 },
    search: { value: search, setValue: setSearch },
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

  if (!CALLS_911) {
    return null;
  }

  return (
    <div className="rounded-md card">
      {audio.addedToCallAudio}
      {audio.incomingCallAudio}
      <ActiveCallsHeader search={asyncTable.search} calls={calls} />

      <div className="px-4">
        {!hasCalls ? (
          <p className="py-2 text-neutral-700 dark:text-gray-300">{t("no911Calls")}</p>
        ) : (
          <Table
            tableState={tableState}
            features={{ isWithinCard: true }}
            data={calls.map((call) => {
              const isUnitAssigned = isUnitAssignedToCall(call);

              return {
                id: call.id,
                rowProps: {
                  className: isUnitAssigned ? "bg-gray-200 dark:bg-quinary" : undefined,
                },
                caseNumber: `#${call.caseNumber}`,
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
              { header: t("caller"), accessorKey: "name" },
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
