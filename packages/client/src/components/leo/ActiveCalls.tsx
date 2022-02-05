import * as React from "react";
import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { Button } from "components/Button";
import { Manage911CallModal } from "components/modals/Manage911CallModal";
import { useAuth } from "context/AuthContext";
import { useRouter } from "next/router";
import { Full911Call, useDispatchState } from "state/dispatchState";
import type { AssignedUnit, Call911 } from "@snailycad/types";
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
import { CallsFilters, useActiveCallsFilters } from "./calls/CallsFilters";
import { CallsFiltersProvider, useCallsFilters } from "context/CallsFiltersContext";
import { Filter } from "react-bootstrap-icons";
import { Table } from "components/shared/Table";
import { FullDate } from "components/shared/FullDate";
import { classNames } from "lib/classNames";

const DescriptionModal = dynamic(
  async () => (await import("components/modal/DescriptionModal/DescriptionModal")).DescriptionModal,
);

function ActiveCallsInner() {
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
  const { setShowFilters, showFilters, search } = useCallsFilters();
  const handleFilter = useActiveCallsFilters();

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
            setTempCall({ ...v, ...call });
            return { ...v, ...call };
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
    await execute(`/911-calls/assign/${call.id}`, {
      method: "POST",
      data: { unit: unit?.id },
    });
  }

  async function handleUnassignFromCall(call: Full911Call) {
    await execute(`/911-calls/unassign/${call.id}`, {
      method: "POST",
      data: { unit: unit?.id },
    });
  }

  if (!CALLS_911) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-md card">
      <header className="flex items-center justify-between p-2 px-4 bg-gray-300/50 dark:bg-gray-3">
        <h3 className="text-xl font-semibold">{t("active911Calls")}</h3>

        <div>
          <Button
            variant="cancel"
            className={classNames("px-1.5 hover:bg-dark-bg", showFilters && "bg-dark-bg")}
            onClick={() => setShowFilters((o) => !o)}
            title={t("callFilters")}
          >
            <Filter aria-label={t("callFilters")} />
          </Button>
        </div>
      </header>

      <div className="px-4">
        <CallsFilters calls={calls} />

        {calls.length <= 0 ? (
          <p className="py-2">{t("no911Calls")}</p>
        ) : (
          <Table
            isWithinCard
            filter={search}
            data={calls
              .sort((a, b) => compareDesc(new Date(a.updatedAt), new Date(b.updatedAt)))
              .filter(handleFilter)
              .map((call) => {
                const isUnitAssigned = isUnitAssignedToCall(call);

                return {
                  rowProps: {
                    className: isUnitAssigned ? "bg-gray-200 dark:bg-gray-3" : undefined,
                  },
                  name: call.name,
                  location: call.location,
                  description:
                    call.description && !call.descriptionData ? (
                      <span className="max-w-4xl text-base min-w-[250px] break-words whitespace-pre-wrap">
                        {call.description}
                      </span>
                    ) : (
                      <Button
                        disabled={isDispatch ? false : !unit}
                        small
                        onClick={() => handleViewDescription(call)}
                      >
                        {common("viewDescription")}
                      </Button>
                    ),
                  updatedAt: <FullDate>{call.updatedAt}</FullDate>,
                  assignedUnits: call.assignedUnits.map(makeUnit).join(", ") || common("none"),
                  actions: (
                    <>
                      <Button
                        disabled={isDispatch ? !hasActiveDispatchers : !unit}
                        small
                        variant="success"
                        onClick={() => handleManageClick(call)}
                      >
                        {isDispatch ? common("manage") : common("view")}
                      </Button>

                      {isDispatch ? null : isUnitAssigned ? (
                        <Button
                          className="ml-2"
                          disabled={!unit}
                          small
                          onClick={() => handleUnassignFromCall(call)}
                        >
                          {t("unassignFromCall")}
                        </Button>
                      ) : (
                        <Button
                          className="ml-2"
                          disabled={!unit}
                          small
                          onClick={() => handleAssignToCall(call)}
                        >
                          {t("assignToCall")}
                        </Button>
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
                    </>
                  ),
                };
              })}
            columns={[
              { Header: t("caller"), accessor: "name" },
              { Header: t("location"), accessor: "location" },
              { Header: common("description"), accessor: "description" },
              { Header: common("updatedAt"), accessor: "updatedAt" },
              { Header: t("assignedUnits"), accessor: "assignedUnits" },
              { Header: common("actions"), accessor: "actions" },
            ]}
          />
        )}
      </div>

      <DispatchCallTowModal call={tempCall} />
      {tempCall?.descriptionData ? (
        <DescriptionModal onClose={() => setTempCall(null)} value={tempCall.descriptionData} />
      ) : null}

      <Manage911CallModal setCall={setTempCall} onClose={() => setTempCall(null)} call={tempCall} />
    </div>
  );
}

export function ActiveCalls() {
  return (
    <CallsFiltersProvider>
      <ActiveCallsInner />
    </CallsFiltersProvider>
  );
}
