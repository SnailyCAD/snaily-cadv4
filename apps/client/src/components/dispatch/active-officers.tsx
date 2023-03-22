import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "@snailycad/ui";
import { ActiveOfficer, useLeoState } from "state/leo-state";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { useActiveOfficers } from "hooks/realtime/useActiveOfficers";
import { useRouter } from "next/router";
import { formatUnitDivisions, makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { useAuth } from "context/AuthContext";
import { CombinedLeoUnit, StatusViewMode, Officer } from "@snailycad/types";
import { Filter } from "react-bootstrap-icons";
import { useActiveDispatchers } from "hooks/realtime/use-active-dispatchers";
import { useTableState, Table } from "components/shared/Table";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { UnitRadioChannelModal } from "./active-units/UnitRadioChannelModal";
import { ActiveUnitsSearch } from "./active-units/ActiveUnitsSearch";
import { classNames } from "lib/classNames";
import { useActiveUnitsState } from "state/active-unit-state";
import { useActiveUnitsFilter } from "hooks/shared/useActiveUnitsFilter";
import { OfficerColumn } from "./active-units/officers/officer-column";
import { isUnitOfficer } from "@snailycad/utils/typeguards";
import { ActiveIncidentColumn } from "./active-units/officers/active-incident-column";
import { ActiveCallColumn } from "./active-units/officers/active-call-column";
import { HoverCard } from "components/shared/HoverCard";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { useMounted } from "@casper124578/useful";
import { shallow } from "zustand/shallow";
import { generateContrastColor } from "lib/table/get-contrasting-text-color";
import dynamic from "next/dynamic";
import { Permissions } from "@snailycad/permissions";
import { usePermission } from "hooks/usePermission";

const CreateTemporaryUnitModal = dynamic(
  async () =>
    (await import("./modals/temporary-units/create-temporary-unit-modal")).CreateTemporaryUnitModal,
  { ssr: false },
);

const ManageUnitModal = dynamic(
  async () => (await import("./modals/manage-unit-modal")).ManageUnitModal,
  { ssr: false },
);

const MergeUnitModal = dynamic(
  async () => (await import("./active-units/MergeUnitModal")).MergeUnitModal,
  { ssr: false },
);

interface Props {
  initialOfficers: ActiveOfficer[];
}

function ActiveOfficers({ initialOfficers }: Props) {
  const t = useTranslations("Leo");
  const common = useTranslations("Common");

  const tableState = useTableState({
    tableId: "active-officers",
    pagination: { pageSize: 12, totalDataCount: initialOfficers.length },
  });

  const { activeOfficers: _activeOfficers, setActiveOfficers } = useActiveOfficers();
  const { openModal } = useModal();
  const { generateCallsign } = useGenerateCallsign();
  const { user } = useAuth();
  const { hasPermissions } = usePermission();
  const { hasActiveDispatchers } = useActiveDispatchers();
  const { handleFilter } = useActiveUnitsFilter();
  const { BADGE_NUMBERS, ACTIVE_INCIDENTS, RADIO_CHANNEL_MANAGEMENT, DIVISIONS } =
    useFeatureEnabled();

  const router = useRouter();
  const isMounted = useMounted();

  const activeOfficers = isMounted ? _activeOfficers : initialOfficers;
  const isDispatch = router.pathname === "/dispatch";

  const hasDispatchPerms = hasPermissions([Permissions.Dispatch], (u) => u.isDispatch);
  const showCreateTemporaryUnitButton = isDispatch && hasDispatchPerms;

  const { leoSearch, showLeoFilters, setShowFilters } = useActiveUnitsState(
    (state) => ({
      leoSearch: state.leoSearch,
      showLeoFilters: state.showLeoFilters,
      setShowFilters: state.setShowFilters,
    }),
    shallow,
  );

  const { activeOfficer, setActiveOfficer } = useLeoState(
    (state) => ({
      activeOfficer: state.activeOfficer,
      setActiveOfficer: state.setActiveOfficer,
    }),
    shallow,
  );

  const [tempOfficer, officerState] = useTemporaryItem(activeOfficers);

  function handleEditClick(officer: ActiveOfficer | CombinedLeoUnit) {
    officerState.setTempId(officer.id);
    openModal(ModalIds.ManageUnit);
  }

  return (
    <div className="rounded-md card">
      <header className="p-2 px-4 bg-gray-200 dark:bg-secondary flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("activeOfficers")}</h1>

        <div className="flex items-center gap-2">
          {showCreateTemporaryUnitButton ? (
            <Button
              variant="cancel"
              className={classNames(
                "px-1.5 dark:border dark:border-quinary dark:bg-tertiary dark:hover:brightness-125 group",
              )}
              onPress={() => openModal(ModalIds.CreateTemporaryUnit, "officer")}
            >
              {t("createTemporaryUnit")}
            </Button>
          ) : null}

          <Button
            variant="cancel"
            className={classNames(
              "px-1.5 py-2 dark:border dark:border-quinary dark:bg-tertiary dark:hover:brightness-125 group",
              showLeoFilters && "dark:!bg-secondary !bg-gray-500",
            )}
            onPress={() => setShowFilters("leo", !showLeoFilters)}
            title={common("filters")}
            disabled={activeOfficers.length <= 0}
          >
            <Filter
              className={classNames("group-hover:fill-white", showLeoFilters && "text-white")}
              aria-label={common("filters")}
            />
          </Button>
        </div>
      </header>

      {activeOfficers.length <= 0 ? (
        <p className="px-4 py-2 text-neutral-700 dark:text-gray-300">{t("noActiveOfficers")}</p>
      ) : (
        <>
          <ActiveUnitsSearch type="leo" />

          <Table
            features={{ isWithinCardOrModal: true }}
            containerProps={{ className: "mb-3 px-4" }}
            tableState={tableState}
            data={activeOfficers
              .filter((officer) => handleFilter(officer, leoSearch))
              .map((officer) => {
                const color = officer.status?.color;

                const useDot = user?.statusViewMode === StatusViewMode.DOT_COLOR;
                const nameAndCallsign = `${generateCallsign(officer)} ${makeUnitName(officer)}`;

                return {
                  id: officer.id,
                  rowProps: {
                    style: {
                      background: !useDot && color ? color : undefined,
                      color: !useDot && color ? generateContrastColor(color) : undefined,
                    },
                  },
                  name: nameAndCallsign,
                  officer: (
                    <OfficerColumn
                      nameAndCallsign={nameAndCallsign}
                      setTempUnit={officerState.setTempId}
                      officer={officer}
                    />
                  ),
                  badgeNumber: isUnitOfficer(officer) && String(officer.badgeNumber),
                  department:
                    (isUnitOfficer(officer) && officer.department?.value.value) ?? common("none"),
                  division: (
                    <HoverCard
                      trigger={
                        <p className="max-w-xs truncate">
                          {isUnitOfficer(officer) && formatUnitDivisions(officer)}
                        </p>
                      }
                      contentProps={{ className: "whitespace-pre-wrap" }}
                    >
                      {isUnitOfficer(officer) && formatUnitDivisions(officer)}
                    </HoverCard>
                  ),
                  rank: (isUnitOfficer(officer) && officer.rank?.value) ?? common("none"),
                  status: (
                    <span className="flex items-center">
                      {useDot && color ? (
                        <span
                          style={{ background: color }}
                          className="block w-3 h-3 mr-2 rounded-full"
                        />
                      ) : null}
                      {officer.status?.value?.value}
                    </span>
                  ),
                  vehicle: officer.activeVehicle?.value.value ?? common("none"),
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
              BADGE_NUMBERS ? { header: t("badgeNumber"), accessorKey: "badgeNumber" } : null,
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
        </>
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
    </div>
  );
}

const ActiveOfficersMemoized = React.memo(ActiveOfficers);
export { ActiveOfficersMemoized as ActiveOfficers };
