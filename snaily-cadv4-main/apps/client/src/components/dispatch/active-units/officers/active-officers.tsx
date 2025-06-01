import * as React from "react";
import { useTranslations } from "use-intl";
import { Button, HoverCard, HoverCardContent, HoverCardTrigger } from "@snailycad/ui";
import { type ActiveOfficer, useLeoState } from "state/leo-state";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { useActiveOfficers } from "hooks/realtime/useActiveOfficers";
import { useRouter } from "next/router";
import { formatUnitDivisions, makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { useAuth } from "context/AuthContext";
import { type CombinedLeoUnit, StatusViewMode, type Officer } from "@snailycad/types";
import { useActiveDispatchers } from "hooks/realtime/use-active-dispatchers";
import { useTableState, Table, useAsyncTable } from "components/shared/Table";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { UnitRadioChannelModal } from "../modals/unit-radio-channel-modal";
import { ActiveUnitsSearch } from "../active-units-search";
import { useActiveUnitsState } from "state/active-unit-state";
import { OfficerColumn } from "./columns/officer-column";
import { isUnitCombined, isUnitOfficer } from "@snailycad/utils/typeguards";
import { ActiveIncidentColumn } from "./columns/active-incident-column";
import { ActiveCallColumn } from "./columns/active-call-column";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { useMounted } from "@casperiv/useful";
import { generateContrastColor } from "lib/table/get-contrasting-text-color";
import dynamic from "next/dynamic";
import { Permissions } from "@snailycad/permissions";
import { usePermission } from "hooks/usePermission";
import { PrivateMessagesModal } from "../private-messages/private-messages-modal";
import type { GetActiveOfficersData } from "@snailycad/types/api";
import { ActiveOfficersHeader } from "./active-officers-header";
import { classNames } from "lib/classNames";

const CreateTemporaryUnitModal = dynamic(
  async () =>
    (await import("../../modals/temporary-units/create-temporary-unit-modal"))
      .CreateTemporaryUnitModal,
  { ssr: false },
);

const ManageUnitModal = dynamic(
  async () => (await import("../modals/manage-unit-modal")).ManageUnitModal,
  { ssr: false },
);

const MergeUnitModal = dynamic(
  async () => (await import("../modals/merge-unit-modal")).MergeUnitModal,
  { ssr: false },
);

interface Props {
  initialOfficers: ActiveOfficer[];
}

function ActiveOfficers({ initialOfficers }: Props) {
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const leoSearch = useActiveUnitsState((state) => state.leoSearch);

  const asyncTable = useAsyncTable({
    search: leoSearch,
    fetchOptions: {
      pageSize: 12,
      refetchOnWindowFocus: false,
      requireFilterText: true,
      path: "/leo/active-officers",
      onResponse: (json: GetActiveOfficersData) => ({
        data: json,
        totalCount: json.length,
      }),
    },
    initialData: initialOfficers,
    totalCount: initialOfficers.length,
    scrollToTopOnDataChange: false,
  });

  const tableState = useTableState({
    tableId: "active-officers",
    pagination: asyncTable.pagination,
  });

  const { activeOfficers: _activeOfficers, setActiveOfficers } = useActiveOfficers();
  const modalState = useModal();
  const { generateCallsign } = useGenerateCallsign();
  const { user } = useAuth();
  const { hasPermissions } = usePermission();
  const { hasActiveDispatchers } = useActiveDispatchers();
  const { BADGE_NUMBERS, ACTIVE_INCIDENTS, RADIO_CHANNEL_MANAGEMENT, DIVISIONS } =
    useFeatureEnabled();

  const router = useRouter();
  const isMounted = useMounted();

  const activeOfficers = isMounted ? _activeOfficers : initialOfficers;
  const isDispatch = router.pathname === "/dispatch";

  const hasDispatchPerms = hasPermissions([Permissions.Dispatch]);
  const showCreateTemporaryUnitButton = isDispatch && hasDispatchPerms;

  const { activeOfficer, setActiveOfficer } = useLeoState((state) => ({
    activeOfficer: state.activeOfficer,
    setActiveOfficer: state.setActiveOfficer,
  }));

  const [tempOfficer, officerState] = useTemporaryItem(activeOfficers);

  function handleEditClick(officer: ActiveOfficer | CombinedLeoUnit) {
    officerState.setTempId(officer.id);
    modalState.openModal(ModalIds.ManageUnit);
  }

  React.useEffect(() => {
    setActiveOfficers(asyncTable.items);
  }, [asyncTable.items]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="rounded-md card mb-3">
      <ActiveOfficersHeader />
      <ActiveUnitsSearch
        totalCount={initialOfficers.length}
        isLoading={asyncTable.isLoading}
        type="leo"
      />

      {activeOfficers.length <= 0 ? (
        <p className="px-4 py-2 text-neutral-700 dark:text-gray-300">{t("noActiveOfficers")}</p>
      ) : (
        <Table
          features={{ isWithinCardOrModal: true }}
          containerProps={{ className: "mb-3 px-4" }}
          tableState={tableState}
          data={activeOfficers.map((officer) => {
            const useDot = user?.statusViewMode === StatusViewMode.DOT_COLOR;
            const nameAndCallsign = `${generateCallsign(officer)} ${makeUnitName(officer)}`;

            const backgroundColor = officer.status?.color;
            const textColor = officer.status?.textColor;
            const color =
              backgroundColor && !useDot
                ? textColor || generateContrastColor(backgroundColor)
                : textColor;

            return {
              id: officer.id,
              rowProps: {
                style: {
                  backgroundColor: !useDot && backgroundColor ? backgroundColor : undefined,
                  color,
                },
              },
              name: nameAndCallsign,
              officer: (
                <OfficerColumn
                  useDot={useDot}
                  textColor={textColor}
                  nameAndCallsign={nameAndCallsign}
                  setTempUnit={officerState.setTempId}
                  officer={officer}
                />
              ),
              badgeNumberString: isUnitOfficer(officer) && officer.badgeNumberString,
              department:
                ((isUnitCombined(officer) && officer.officers[0]?.department?.value.value) ||
                  (isUnitOfficer(officer) && officer.department?.value.value)) ??
                common("none"),
              division: (
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <p className={classNames("max-w-xs truncate", textColor)}>
                      {isUnitOfficer(officer) && formatUnitDivisions(officer)}
                    </p>
                  </HoverCardTrigger>

                  <HoverCardContent className="whitespace-pre-wrap" pointerEvents>
                    {isUnitOfficer(officer) && formatUnitDivisions(officer)}
                  </HoverCardContent>
                </HoverCard>
              ),
              rank: (isUnitOfficer(officer) && officer.rank?.value) ?? common("none"),
              status: (
                <span className="flex items-center">
                  {useDot && backgroundColor ? (
                    <span
                      style={{ background: backgroundColor }}
                      className="block w-3 h-3 mr-2 rounded-full"
                    />
                  ) : null}
                  {officer.status?.value?.value}
                </span>
              ),
              vehicle: officer.activeVehicle ? (
                <HoverCard>
                  <HoverCardTrigger>{officer.activeVehicle.value.value}</HoverCardTrigger>
                  <HoverCardContent>
                    {officer.activeVehicle.description ?? officer.activeVehicle.value.value}
                  </HoverCardContent>
                </HoverCard>
              ) : (
                common("none")
              ),
              incident: (
                <ActiveIncidentColumn
                  unitId={officer.id}
                  isDispatch={isDispatch}
                  incidentId={officer.activeIncidentId}
                />
              ),
              activeCall: (
                <ActiveCallColumn
                  unitId={officer.id}
                  isDispatch={isDispatch}
                  callId={officer.activeCallId}
                  size="sm"
                />
              ),
              radioChannel: <UnitRadioChannelModal unit={officer} />,
              actions: isDispatch ? (
                <Button
                  disabled={!hasActiveDispatchers}
                  onPress={() => handleEditClick(officer)}
                  size="xs"
                  variant="success"
                >
                  {common("manage")}
                </Button>
              ) : null,
            };
          })}
          columns={[
            { header: t("officer"), accessorKey: "officer" },
            BADGE_NUMBERS ? { header: t("badgeNumber"), accessorKey: "badgeNumberString" } : null,
            { header: t("department"), accessorKey: "department" },
            DIVISIONS ? { header: t("division"), accessorKey: "division" } : null,
            { header: t("rank"), accessorKey: "rank" },
            { header: t("status"), accessorKey: "status" },
            { header: t("patrolVehicle"), accessorKey: "vehicle" },
            ACTIVE_INCIDENTS ? { header: t("incident"), accessorKey: "incident" } : null,
            { header: t("activeCall"), accessorKey: "activeCall" },
            RADIO_CHANNEL_MANAGEMENT
              ? { header: t("radioChannel"), accessorKey: "radioChannel" }
              : null,
            isDispatch ? { header: common("actions"), accessorKey: "actions" } : null,
          ]}
        />
      )}

      {tempOfficer ? (
        <ManageUnitModal onClose={() => officerState.setTempId(null)} unit={tempOfficer} />
      ) : null}
      {tempOfficer ? (
        <MergeUnitModal
          type="leo"
          isDispatch={isDispatch}
          unit={tempOfficer as Officer}
          onClose={() => officerState.setTempId(null)}
          activeUnit={activeOfficer}
          activeUnits={activeOfficers}
          setActiveUnit={setActiveOfficer}
          setActiveUnits={setActiveOfficers}
        />
      ) : null}
      {isDispatch && showCreateTemporaryUnitButton ? <CreateTemporaryUnitModal /> : null}
      {isDispatch ? <PrivateMessagesModal /> : null}
    </div>
  );
}

const ActiveOfficersMemoized = React.memo(ActiveOfficers);
export { ActiveOfficersMemoized as ActiveOfficers };
