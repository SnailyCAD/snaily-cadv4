import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "@snailycad/ui";
import type { ActiveOfficer } from "state/leoState";
import { ManageUnitModal } from "./modals/ManageUnit";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { useActiveOfficers } from "hooks/realtime/useActiveOfficers";
import { useRouter } from "next/router";
import { formatUnitDivisions, makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { useAuth } from "context/AuthContext";
import { CombinedLeoUnit, StatusViewMode, Officer } from "@snailycad/types";
import { Filter } from "react-bootstrap-icons";
import { useActiveDispatchers } from "hooks/realtime/useActiveDispatchers";
import { useTableState, Table } from "components/shared/Table";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { UnitRadioChannelModal } from "./active-units/UnitRadioChannelModal";
import { ActiveUnitsSearch } from "./active-units/ActiveUnitsSearch";
import { classNames } from "lib/classNames";
import { useActiveUnitsState } from "state/activeUnitsState";
import { useActiveUnitsFilter } from "hooks/shared/useActiveUnitsFilter";
import { MergeUnitModal } from "./active-units/MergeUnitModal";
import { OfficerColumn } from "./active-units/officers/OfficerColumn";
import { isUnitOfficer } from "@snailycad/utils/typeguards";
import { ActiveIncidentColumn } from "./active-units/officers/ActiveIncidentColumn";
import { ActiveCallColumn } from "./active-units/officers/ActiveCallColumn";
import { useActiveIncidents } from "hooks/realtime/useActiveIncidents";
import { HoverCard } from "components/shared/HoverCard";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { useMounted } from "@casper124578/useful";
import { useCall911State } from "state/dispatch/call911State";

interface Props {
  initialOfficers: ActiveOfficer[];
}

function ActiveOfficers({ initialOfficers }: Props) {
  const tableState = useTableState({
    pagination: { pageSize: 12, totalDataCount: initialOfficers.length },
  });

  const { activeOfficers: _activeOfficers } = useActiveOfficers();
  const { activeIncidents } = useActiveIncidents();
  const { calls } = useCall911State();
  const isMounted = useMounted();
  const activeOfficers = isMounted ? _activeOfficers : initialOfficers;

  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { openModal } = useModal();
  const { generateCallsign } = useGenerateCallsign();
  const { user } = useAuth();

  const { hasActiveDispatchers } = useActiveDispatchers();
  const { BADGE_NUMBERS, ACTIVE_INCIDENTS, RADIO_CHANNEL_MANAGEMENT, DIVISIONS } =
    useFeatureEnabled();
  const { leoSearch, showLeoFilters, setShowFilters } = useActiveUnitsState();
  const { handleFilter } = useActiveUnitsFilter();

  const router = useRouter();
  const isDispatch = router.pathname === "/dispatch";

  const [tempOfficer, officerState] = useTemporaryItem(activeOfficers);

  function handleEditClick(officer: ActiveOfficer | CombinedLeoUnit) {
    officerState.setTempId(officer.id);
    openModal(ModalIds.ManageUnit);
  }

  return (
    <div className="rounded-md card">
      <header className="p-2 px-4 bg-gray-200 dark:bg-secondary flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("activeOfficers")}</h1>

        <div>
          <Button
            variant="cancel"
            className={classNames(
              "px-1.5 dark:border dark:border-quinary dark:bg-tertiary dark:hover:brightness-125 group",
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
            features={{ isWithinCard: true }}
            containerProps={{ className: "mb-3 px-4" }}
            tableState={tableState}
            data={activeOfficers
              .filter((officer) => handleFilter(officer, leoSearch))
              .map((officer) => {
                const color = officer.status?.color;

                const activeIncident =
                  activeIncidents.find((v) => v.id === officer.activeIncidentId) ?? null;
                const activeCall = calls.find((v) => v.id === officer.activeCallId) ?? null;

                const useDot = user?.statusViewMode === StatusViewMode.DOT_COLOR;
                const nameAndCallsign = `${generateCallsign(officer)} ${makeUnitName(officer)}`;

                return {
                  id: officer.id,
                  rowProps: { style: { background: !useDot ? color ?? undefined : undefined } },
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
                  incident: (
                    <ActiveIncidentColumn isDispatch={isDispatch} incident={activeIncident} />
                  ),
                  activeCall: <ActiveCallColumn isDispatch={isDispatch} call={activeCall} />,
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
          isDispatch={isDispatch}
          unit={tempOfficer as Officer}
          onClose={() => officerState.setTempId(null)}
        />
      ) : null}
    </div>
  );
}

const ActiveOfficersMemoized = React.memo(ActiveOfficers);
export { ActiveOfficersMemoized as ActiveOfficers };
