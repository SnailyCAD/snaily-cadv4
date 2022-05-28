import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
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
import { Table } from "components/shared/Table";
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
import { useDispatchState } from "state/dispatchState";

export function ActiveOfficers() {
  const { activeOfficers } = useActiveOfficers();
  const { activeIncidents } = useActiveIncidents();
  const { calls } = useDispatchState();

  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { openModal } = useModal();
  const { generateCallsign } = useGenerateCallsign();
  const { user } = useAuth();

  const { hasActiveDispatchers } = useActiveDispatchers();
  const { ACTIVE_INCIDENTS, RADIO_CHANNEL_MANAGEMENT } = useFeatureEnabled();
  const { leoSearch, showLeoFilters, setShowFilters } = useActiveUnitsState();
  const { handleFilter } = useActiveUnitsFilter();

  const router = useRouter();
  const isDispatch = router.pathname === "/dispatch";

  const [tempUnit, setTempUnit] = React.useState<ActiveOfficer | CombinedLeoUnit | null>(null);

  function handleEditClick(officer: ActiveOfficer | CombinedLeoUnit) {
    setTempUnit(officer);
    openModal(ModalIds.ManageUnit);
  }

  return (
    <div className="overflow-hidden rounded-md bg-gray-200/80 dark:bg-gray-2">
      <header className="p-2 px-4 bg-gray-300/50 dark:bg-gray-3 flex items-center justify-between">
        <h3 className="text-xl font-semibold">{t("activeOfficers")}</h3>

        <div>
          <Button
            variant="cancel"
            className={classNames(
              "px-1.5 hover:bg-gray-500 dark:hover:bg-dark-bg group",
              showLeoFilters && "dark:!bg-dark-bg !bg-gray-500",
            )}
            onClick={() => setShowFilters("leo", !showLeoFilters)}
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
        <p className="px-4 py-2">{t("noActiveOfficers")}</p>
      ) : (
        <>
          <ActiveUnitsSearch type="leo" />

          <Table
            isWithinCard
            containerProps={{ className: "mb-3 px-4" }}
            data={activeOfficers
              .filter((officer) => handleFilter(officer, leoSearch))
              .map((officer) => {
                const color = officer.status?.color;
                const activeIncidentId = isUnitOfficer(officer) ? officer.activeIncidentId : null;

                const activeIncident =
                  activeIncidents.find((v) => v.id === activeIncidentId) ?? null;
                const activeCall = calls.find((v) => v.id === officer.activeCallId) ?? null;

                const useDot = user?.statusViewMode === StatusViewMode.DOT_COLOR;
                const nameAndCallsign = `${generateCallsign(officer)} ${makeUnitName(officer)}`;

                return {
                  rowProps: { style: { background: !useDot ? color ?? undefined : undefined } },
                  name: nameAndCallsign,
                  officer: (
                    <OfficerColumn
                      nameAndCallsign={nameAndCallsign}
                      setTempUnit={setTempUnit}
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
                  incident: <ActiveIncidentColumn incident={activeIncident} />,
                  activeCall: <ActiveCallColumn isDispatch={isDispatch} call={activeCall} />,
                  radioChannel: <UnitRadioChannelModal unit={officer} />,
                  actions: isDispatch ? (
                    <Button
                      disabled={!hasActiveDispatchers}
                      onClick={() => handleEditClick(officer)}
                      small
                      variant="success"
                    >
                      {common("manage")}
                    </Button>
                  ) : null,
                };
              })}
            columns={[
              { Header: t("officer"), accessor: "officer" },
              { Header: t("badgeNumber"), accessor: "badgeNumber" },
              { Header: t("department"), accessor: "department" },
              { Header: t("division"), accessor: "division" },
              { Header: t("rank"), accessor: "rank" },
              { Header: t("status"), accessor: "status" },
              ACTIVE_INCIDENTS ? { Header: t("incident"), accessor: "incident" } : null,
              { Header: t("activeCall"), accessor: "activeCall" },
              RADIO_CHANNEL_MANAGEMENT
                ? { Header: t("radioChannel"), accessor: "radioChannel" }
                : null,
              isDispatch ? { Header: common("actions"), accessor: "actions" } : null,
            ]}
          />
        </>
      )}

      {tempUnit ? <ManageUnitModal onClose={() => setTempUnit(null)} unit={tempUnit} /> : null}
      {tempUnit ? (
        <MergeUnitModal
          isDispatch={isDispatch}
          unit={tempUnit as Officer}
          onClose={() => setTempUnit(null)}
        />
      ) : null}
    </div>
  );
}
