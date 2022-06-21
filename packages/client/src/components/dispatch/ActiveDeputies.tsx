import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { ManageUnitModal } from "./modals/ManageUnit";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import type { ActiveDeputy } from "state/emsFdState";
import { useActiveDeputies } from "hooks/realtime/useActiveDeputies";
import { useRouter } from "next/router";
import { formatUnitDivisions, makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { StatusViewMode } from "@snailycad/types";
import { useAuth } from "context/AuthContext";

import { Table } from "components/shared/Table";
import { useActiveDispatchers } from "hooks/realtime/useActiveDispatchers";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { UnitRadioChannelModal } from "./active-units/UnitRadioChannelModal";
import { useActiveUnitsState } from "state/activeUnitsState";
import { classNames } from "lib/classNames";
import { Filter } from "react-bootstrap-icons";
import { ActiveUnitsSearch } from "./active-units/ActiveUnitsSearch";
import { useActiveUnitsFilter } from "hooks/shared/useActiveUnitsFilter";
import { useDispatchState } from "state/dispatchState";
import { ActiveCallColumn } from "./active-units/officers/ActiveCallColumn";
import { ActiveIncidentColumn } from "./active-units/officers/ActiveIncidentColumn";
import { useActiveIncidents } from "hooks/realtime/useActiveIncidents";
import { DeputyColumn } from "./active-units/deputies/DeputyColumn";

export function ActiveDeputies() {
  const { activeDeputies } = useActiveDeputies();
  const { activeIncidents } = useActiveIncidents();

  const t = useTranslations();
  const common = useTranslations("Common");
  const { openModal } = useModal();
  const { generateCallsign } = useGenerateCallsign();
  const { user } = useAuth();
  const { hasActiveDispatchers } = useActiveDispatchers();
  const { RADIO_CHANNEL_MANAGEMENT, ACTIVE_INCIDENTS } = useFeatureEnabled();
  const { emsSearch, showEmsFilters, setShowFilters } = useActiveUnitsState();
  const { handleFilter } = useActiveUnitsFilter();
  const { calls } = useDispatchState();

  const router = useRouter();
  const isDispatch = router.pathname === "/dispatch";

  const [tempUnit, setTempUnit] = React.useState<ActiveDeputy | null>(null);

  function handleEditClick(officer: ActiveDeputy) {
    setTempUnit(officer);
    openModal(ModalIds.ManageUnit);
  }

  return (
    <div className="mt-3 overflow-hidden rounded-md bg-gray-200/80 dark:bg-gray-2">
      <header className="p-2 px-4 bg-gray-200 dark:bg-gray-3 flex items-center justify-between">
        <h3 className="text-xl font-semibold">{t("Ems.activeDeputies")}</h3>

        <div>
          <Button
            variant="cancel"
            className={classNames(
              "px-1.5 hover:bg-gray-500 dark:hover:bg-dark-bg group",
              showEmsFilters && "dark:!bg-dark-bg !bg-gray-500",
            )}
            onClick={() => setShowFilters("ems-fd", !showEmsFilters)}
            title={common("filters")}
            disabled={activeDeputies.length <= 0}
          >
            <Filter
              className={classNames("group-hover:fill-white", showEmsFilters && "text-white")}
              aria-label={common("filters")}
            />
          </Button>
        </div>
      </header>

      {activeDeputies.length <= 0 ? (
        <p className="px-4 py-2">{t("Ems.noActiveDeputies")}</p>
      ) : (
        <>
          <ActiveUnitsSearch type="ems-fd" />

          <Table
            isWithinCard
            containerProps={{ className: "mb-3 px-4" }}
            data={activeDeputies
              .filter((deputy) => handleFilter(deputy, emsSearch))
              .map((deputy) => {
                const color = deputy.status?.color;
                const useDot = user?.statusViewMode === StatusViewMode.DOT_COLOR;

                const activeIncident =
                  activeIncidents.find((v) => v.id === deputy.activeIncidentId) ?? null;
                const activeCall = calls.find((v) => v.id === deputy.activeCallId) ?? null;

                const nameAndCallsign = `${generateCallsign(deputy)} ${makeUnitName(deputy)}`;

                return {
                  rowProps: { style: { background: !useDot ? color ?? undefined : undefined } },
                  name: nameAndCallsign,
                  deputy: (
                    <DeputyColumn
                      deputy={deputy}
                      isDispatch={isDispatch}
                      nameAndCallsign={nameAndCallsign}
                    />
                  ),
                  badgeNumber: deputy.badgeNumber,
                  department: deputy.department?.value.value ?? common("none"),
                  division: formatUnitDivisions(deputy),
                  rank: deputy.rank?.value ?? common("none"),
                  status: (
                    <span className="flex items-center">
                      {useDot && color ? (
                        <span
                          style={{ background: color }}
                          className="block w-3 h-3 mr-2 rounded-full"
                        />
                      ) : null}
                      {deputy.status?.value?.value}
                    </span>
                  ),
                  radioChannel: <UnitRadioChannelModal unit={deputy} />,
                  incident: (
                    <ActiveIncidentColumn isDispatch={isDispatch} incident={activeIncident} />
                  ),
                  activeCall: <ActiveCallColumn isDispatch={isDispatch} call={activeCall} />,
                  actions: isDispatch ? (
                    <Button
                      disabled={!hasActiveDispatchers}
                      onClick={() => handleEditClick(deputy)}
                      size="xs"
                      variant="success"
                    >
                      {common("manage")}
                    </Button>
                  ) : null,
                };
              })}
            columns={[
              { Header: t("Ems.deputy"), accessor: "deputy" },
              { Header: t("Leo.badgeNumber"), accessor: "badgeNumber" },
              { Header: t("Leo.department"), accessor: "department" },
              { Header: t("Leo.division"), accessor: "division" },
              { Header: t("Leo.rank"), accessor: "rank" },
              { Header: t("Leo.status"), accessor: "status" },
              RADIO_CHANNEL_MANAGEMENT
                ? { Header: t("Leo.radioChannel"), accessor: "radioChannel" }
                : null,
              ACTIVE_INCIDENTS ? { Header: t("Leo.incident"), accessor: "incident" } : null,
              { Header: t("Leo.activeCall"), accessor: "activeCall" },
              isDispatch ? { Header: common("actions"), accessor: "actions" } : null,
            ]}
          />
        </>
      )}

      {tempUnit ? (
        <ManageUnitModal type="ems-fd" onClose={() => setTempUnit(null)} unit={tempUnit} />
      ) : null}
    </div>
  );
}
