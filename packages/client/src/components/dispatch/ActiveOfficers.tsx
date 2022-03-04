import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import type { ActiveOfficer } from "state/leoState";
import { ManageUnitModal } from "./modals/ManageUnit";
import { useModal } from "context/ModalContext";
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
import type { FullIncident } from "src/pages/officer/incidents";
import { ManageIncidentModal } from "components/leo/incidents/ManageIncidentModal";
import { UnitRadioChannelModal } from "./active-units/UnitRadioChannelModal";
import { ActiveUnitsSearch } from "./active-units/ActiveUnitsSearch";
import { classNames } from "lib/classNames";
import { useActiveUnitsState } from "state/activeUnitsState";
import { useActiveUnitsFilter } from "hooks/shared/useActiveUnitsFilter";
import { MergeUnitModal } from "./active-units/MergeUnitModal";
import { OfficerColumn } from "./active-units/officers/OfficerColumn";

export function ActiveOfficers() {
  const { activeOfficers } = useActiveOfficers();

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
  const [tempIncident, setTempIncident] = React.useState<FullIncident | null>(null);

  function handleEditClick(officer: ActiveOfficer | CombinedLeoUnit) {
    setTempUnit(officer);
    openModal(ModalIds.ManageUnit);
  }

  function handleIncidentOpen(incident: FullIncident) {
    setTempIncident(incident);
    openModal(ModalIds.ManageIncident);
  }

  return (
    <div className="overflow-hidden rounded-md bg-gray-200/80 dark:bg-gray-2">
      <header className="p-2 px-4 bg-gray-300/50 dark:bg-gray-3 flex items-center justify-between">
        <h3 className="text-xl font-semibold">{t("activeOfficers")}</h3>

        <div>
          <Button
            variant="cancel"
            className={classNames("px-1.5 hover:bg-dark-bg", showLeoFilters && "bg-dark-bg")}
            onClick={() => setShowFilters("leo", !showLeoFilters)}
            title={common("filters")}
          >
            <Filter aria-label={common("filters")} />
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
                const activeIncident =
                  "officers" in officer ? null : (officer.activeIncident as FullIncident | null);

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
                  badgeNumber: !("officers" in officer) && String(officer.badgeNumber),
                  department:
                    (!("officers" in officer) && officer.department?.value.value) ?? common("none"),
                  division: !("officers" in officer) && formatUnitDivisions(officer),
                  rank: (!("officers" in officer) && officer.rank?.value) ?? common("none"),
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
                  incident: activeIncident ? (
                    <Button
                      onClick={() =>
                        handleIncidentOpen({
                          ...activeIncident,
                          isActive: true,
                        } as FullIncident)
                      }
                    >
                      #{activeIncident.caseNumber}
                    </Button>
                  ) : (
                    common("none")
                  ),
                  radioChannel:
                    "radioChannelId" in officer ? <UnitRadioChannelModal unit={officer} /> : null,
                  actions: isDispatch ? (
                    <>
                      <Button
                        disabled={!hasActiveDispatchers}
                        onClick={() => handleEditClick(officer)}
                        small
                        variant="success"
                      >
                        {common("manage")}
                      </Button>
                    </>
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
      {tempIncident ? (
        <ManageIncidentModal incident={tempIncident} onClose={() => setTempIncident(null)} />
      ) : null}
    </div>
  );
}
