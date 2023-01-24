import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "@snailycad/ui";
import { ManageUnitModal } from "./modals/ManageUnit";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import type { ActiveDeputy } from "state/ems-fd-state";
import { useActiveDeputies } from "hooks/realtime/useActiveDeputies";
import { useRouter } from "next/router";
import { formatUnitDivisions, makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { EmsFdDeputy, StatusViewMode } from "@snailycad/types";
import { useAuth } from "context/AuthContext";

import { Table, useTableState } from "components/shared/Table";
import { useActiveDispatchers } from "hooks/realtime/use-active-dispatchers";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { UnitRadioChannelModal } from "./active-units/UnitRadioChannelModal";
import { useActiveUnitsState } from "state/active-unit-state";
import { classNames } from "lib/classNames";
import { Filter } from "react-bootstrap-icons";
import { ActiveUnitsSearch } from "./active-units/ActiveUnitsSearch";
import { useActiveUnitsFilter } from "hooks/shared/useActiveUnitsFilter";
import { ActiveCallColumn } from "./active-units/officers/ActiveCallColumn";
import { ActiveIncidentColumn } from "./active-units/officers/ActiveIncidentColumn";
import { useActiveIncidents } from "hooks/realtime/useActiveIncidents";
import { DeputyColumn } from "./active-units/deputies/DeputyColumn";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { useMounted } from "@casper124578/useful";
import { useCall911State } from "state/dispatch/call-911-state";
import { shallow } from "zustand/shallow";
import { generateContrastColor } from "lib/table/get-contrasting-text-color";
import { Permissions, usePermission } from "hooks/usePermission";

interface Props {
  initialDeputies: EmsFdDeputy[];
}

function ActiveDeputies({ initialDeputies }: Props) {
  const { activeDeputies: _activeDeputies } = useActiveDeputies();
  const { activeIncidents } = useActiveIncidents();
  const isMounted = useMounted();
  const activeDeputies = isMounted ? _activeDeputies : initialDeputies;

  const { hasPermissions } = usePermission();

  const t = useTranslations();
  const common = useTranslations("Common");
  const { openModal } = useModal();
  const { generateCallsign } = useGenerateCallsign();
  const { user } = useAuth();
  const { hasActiveDispatchers } = useActiveDispatchers();
  const { DIVISIONS, BADGE_NUMBERS, RADIO_CHANNEL_MANAGEMENT, ACTIVE_INCIDENTS } =
    useFeatureEnabled();
  const { emsSearch, showEmsFilters, setShowFilters } = useActiveUnitsState(
    (state) => ({
      emsSearch: state.emsSearch,
      showEmsFilters: state.showEmsFilters,
      setShowFilters: state.setShowFilters,
    }),
    shallow,
  );
  const { handleFilter } = useActiveUnitsFilter();
  const active911Calls = useCall911State((state) => state.calls);
  const tableState = useTableState({ tableId: "active-deputies" });

  const router = useRouter();
  const isDispatch = router.pathname === "/dispatch";

  const hasDispatchPerms = hasPermissions([Permissions.Dispatch], (u) => u.isDispatch);
  const showCreateTemporaryUnitButton = isDispatch && hasDispatchPerms;

  const [tempDeputy, deputyState] = useTemporaryItem(activeDeputies);

  function handleEditClick(deputy: ActiveDeputy) {
    deputyState.setTempId(deputy.id);
    openModal(ModalIds.ManageUnit);
  }

  return (
    <div className="mt-3 rounded-md card">
      <header className="p-2 px-4 bg-gray-200 dark:bg-secondary flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("Ems.activeDeputies")}</h1>

        <div className="flex items-center gap-2">
          {showCreateTemporaryUnitButton ? (
            <Button
              variant="cancel"
              className={classNames(
                "px-1.5 dark:border dark:border-quinary dark:bg-tertiary dark:hover:brightness-125 group",
              )}
              onPress={() => openModal(ModalIds.CreateTemporaryUnit, "ems-fd")}
            >
              {t("Leo.createTemporaryUnit")}
            </Button>
          ) : null}
          <Button
            variant="cancel"
            className={classNames(
              "px-1.5 py-2  dark:border dark:border-quinary dark:bg-tertiary dark:hover:brightness-125 group",
              showEmsFilters && "dark:!bg-secondary !bg-gray-500",
            )}
            onPress={() => setShowFilters("ems-fd", !showEmsFilters)}
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
            tableState={tableState}
            features={{ isWithinCardOrModal: true }}
            containerProps={{ className: "mb-3 px-4" }}
            data={activeDeputies
              .filter((deputy) => handleFilter(deputy, emsSearch))
              .map((deputy) => {
                const color = deputy.status?.color;
                const useDot = user?.statusViewMode === StatusViewMode.DOT_COLOR;

                const activeIncident =
                  activeIncidents.find((v) => v.id === deputy.activeIncidentId) ?? null;
                const activeCall = active911Calls.find((v) => v.id === deputy.activeCallId) ?? null;

                const nameAndCallsign = `${generateCallsign(deputy)} ${makeUnitName(deputy)}`;

                return {
                  id: deputy.id,
                  rowProps: {
                    style: {
                      background: !useDot && color ? color : undefined,
                      color: !useDot && color ? generateContrastColor(color) : undefined,
                    },
                  },
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
                  vehicle: deputy.activeVehicle?.value.value ?? common("none"),
                  incident: (
                    <ActiveIncidentColumn isDispatch={isDispatch} incident={activeIncident} />
                  ),
                  activeCall: <ActiveCallColumn isDispatch={isDispatch} call={activeCall} />,
                  radioChannel: <UnitRadioChannelModal unit={deputy} />,
                  actions: isDispatch ? (
                    <Button
                      disabled={!hasActiveDispatchers}
                      onPress={() => handleEditClick(deputy)}
                      size="xs"
                      variant="success"
                    >
                      {common("manage")}
                    </Button>
                  ) : null,
                };
              })}
            columns={[
              { header: t("Ems.deputy"), accessorKey: "deputy" },
              BADGE_NUMBERS ? { header: t("Leo.badgeNumber"), accessorKey: "badgeNumber" } : null,
              { header: t("Leo.department"), accessorKey: "department" },
              DIVISIONS ? { header: t("Leo.division"), accessorKey: "division" } : null,
              { header: t("Leo.rank"), accessorKey: "rank" },
              { header: t("Leo.status"), accessorKey: "status" },
              { header: t("Ems.emergencyVehicle"), accessorKey: "vehicle" },
              ACTIVE_INCIDENTS ? { header: t("Leo.incident"), accessorKey: "incident" } : null,
              { header: t("Leo.activeCall"), accessorKey: "activeCall" },
              RADIO_CHANNEL_MANAGEMENT
                ? { header: t("Leo.radioChannel"), accessorKey: "radioChannel" }
                : null,
              isDispatch ? { header: common("actions"), accessorKey: "actions" } : null,
            ]}
          />
        </>
      )}

      {tempDeputy ? (
        <ManageUnitModal
          type="ems-fd"
          onClose={() => deputyState.setTempId(null)}
          unit={tempDeputy}
        />
      ) : null}
    </div>
  );
}

const ActiveDeputiesMemoized = React.memo(ActiveDeputies);
export { ActiveDeputiesMemoized as ActiveDeputies };
