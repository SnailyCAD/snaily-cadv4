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
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { useAsyncTable } from "hooks/shared/table/useAsyncTable";
import type { GetActiveOfficersData } from "@snailycad/types/api";

interface Props {
  initialOfficers: GetActiveOfficersData;
}

function ActiveOfficers({ initialOfficers }: Props) {
  const { activeOfficers: _activeOfficers, setActiveOfficerInMap } = useActiveOfficers();
  const { activeIncidents } = useActiveIncidents();
  const { calls } = useDispatchState();

  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { openModal } = useModal();
  const { generateCallsign } = useGenerateCallsign();
  const { user } = useAuth();

  const { hasActiveDispatchers } = useActiveDispatchers();
  const { BADGE_NUMBERS, ACTIVE_INCIDENTS, RADIO_CHANNEL_MANAGEMENT } = useFeatureEnabled();
  const { leoSearch, showLeoFilters, setShowFilters } = useActiveUnitsState();
  const { handleFilter } = useActiveUnitsFilter();

  const router = useRouter();
  const isDispatch = router.pathname === "/dispatch";

  const asyncTable = useAsyncTable({
    initialData: initialOfficers.officers,
    totalCount: initialOfficers.totalCount,
    state: {
      data: Array.from(_activeOfficers.values()),
      setData: (data) => {
        for (const officer of data) {
          setActiveOfficerInMap(officer);
        }
      },
    },
    fetchOptions: {
      onResponse: (json: GetActiveOfficersData) => ({
        data: json.officers,
        totalCount: json.totalCount,
      }),
      path: "/leo/active-officers",
    },
  });

  const [tempOfficer, officerState] = useTemporaryItem(asyncTable.data);

  function handleEditClick(officer: ActiveOfficer | CombinedLeoUnit) {
    officerState.setTempId(officer.id);
    openModal(ModalIds.ManageUnit);
  }

  return (
    <div className="overflow-hidden rounded-md bg-gray-200/80 dark:bg-gray-2">
      <header className="p-2 px-4 bg-gray-200 dark:bg-gray-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("activeOfficers")}</h1>

        <div>
          <Button
            variant="cancel"
            className={classNames(
              "px-1.5 hover:bg-gray-500 dark:hover:bg-dark-bg group",
              showLeoFilters && "dark:!bg-dark-bg !bg-gray-500",
            )}
            onClick={() => setShowFilters("leo", !showLeoFilters)}
            title={common("filters")}
            disabled={asyncTable.data.length <= 0}
          >
            <Filter
              className={classNames("group-hover:fill-white", showLeoFilters && "text-white")}
              aria-label={common("filters")}
            />
          </Button>
        </div>
      </header>

      {initialOfficers.totalCount <= 0 ? (
        <p className="px-4 py-2 text-neutral-700 dark:text-gray-300">{t("noActiveOfficers")}</p>
      ) : (
        <>
          <ActiveUnitsSearch search={asyncTable.search} type="leo" />

          <Table
            pagination={{
              enabled: true,
              totalCount: asyncTable.pagination.totalCount,
              fetchData: asyncTable.pagination,
            }}
            maxItemsPerPage={15}
            isWithinCard
            containerProps={{ className: "mb-3 px-4" }}
            data={asyncTable.data
              .filter((officer) => handleFilter(officer, leoSearch))
              .map((officer) => {
                const color = officer.status?.color;

                const activeIncident =
                  activeIncidents.find((v) => v.id === officer.activeIncidentId) ?? null;
                const activeCall = calls.find((v) => v.id === officer.activeCallId) ?? null;

                const useDot = user?.statusViewMode === StatusViewMode.DOT_COLOR;
                const nameAndCallsign = `${generateCallsign(officer)} ${makeUnitName(officer)}`;

                return {
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
                      onClick={() => handleEditClick(officer)}
                      size="xs"
                      variant="success"
                    >
                      {common("manage")}
                    </Button>
                  ) : null,
                };
              })}
            columns={[
              { Header: t("officer"), accessor: "officer" },
              BADGE_NUMBERS ? { Header: t("badgeNumber"), accessor: "badgeNumber" } : null,
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
