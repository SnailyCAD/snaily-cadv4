import * as React from "react";
import { useTranslations } from "use-intl";
import { Button, HoverCard, HoverCardContent, HoverCardTrigger } from "@snailycad/ui";
import { ManageUnitModal } from "../modals/manage-unit-modal";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { type ActiveDeputy, useEmsFdState } from "state/ems-fd-state";
import { useActiveDeputies } from "hooks/realtime/useActiveDeputies";
import { useRouter } from "next/router";
import { formatUnitDivisions, makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { type CombinedEmsFdUnit, type EmsFdDeputy, StatusViewMode } from "@snailycad/types";
import { useAuth } from "context/AuthContext";

import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import { useActiveDispatchers } from "hooks/realtime/use-active-dispatchers";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { UnitRadioChannelModal } from "../modals/unit-radio-channel-modal";
import { useActiveUnitsState } from "state/active-unit-state";
import { ActiveUnitsSearch } from "../active-units-search";
import { ActiveCallColumn } from "../officers/columns/active-call-column";
import { ActiveIncidentColumn } from "../officers/columns/active-incident-column";
import { DeputyColumn } from "./deputy-column";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { useMounted } from "@casperiv/useful";
import { generateContrastColor } from "lib/table/get-contrasting-text-color";
import { isUnitCombinedEmsFd } from "@snailycad/utils";
import { MergeUnitModal } from "../modals/merge-unit-modal";
import type { GetEmsFdActiveDeputies } from "@snailycad/types/api";
import { ActiveDeputiesHeader } from "./active-deputies-header";

interface Props {
  initialDeputies: (EmsFdDeputy | CombinedEmsFdUnit)[];
}

function ActiveDeputies({ initialDeputies }: Props) {
  const t = useTranslations();
  const common = useTranslations("Common");
  const emsSearch = useActiveUnitsState((state) => state.emsSearch);

  const asyncTable = useAsyncTable({
    search: emsSearch,
    fetchOptions: {
      refetchOnWindowFocus: false,
      pageSize: 12,
      requireFilterText: true,
      path: "/ems-fd/active-deputies",
      onResponse: (json: GetEmsFdActiveDeputies) => ({
        data: json,
        totalCount: json.length,
      }),
    },
    initialData: initialDeputies,
    totalCount: initialDeputies.length,
    scrollToTopOnDataChange: false,
  });

  const tableState = useTableState({
    tableId: "active-deputies",
    pagination: asyncTable.pagination,
  });

  const { activeDeputies: _activeDeputies, setActiveDeputies } = useActiveDeputies();
  const modalState = useModal();
  const { generateCallsign } = useGenerateCallsign();
  const { user } = useAuth();
  const { hasActiveDispatchers } = useActiveDispatchers();
  const { DIVISIONS, BADGE_NUMBERS, RADIO_CHANNEL_MANAGEMENT, ACTIVE_INCIDENTS } =
    useFeatureEnabled();

  const isMounted = useMounted();
  const router = useRouter();

  const activeDeputies = isMounted ? _activeDeputies : initialDeputies;
  const isDispatch = router.pathname === "/dispatch";

  const { activeDeputy, setActiveDeputy } = useEmsFdState((state) => ({
    activeDeputy: state.activeDeputy,
    setActiveDeputy: state.setActiveDeputy,
  }));

  const [tempDeputy, deputyState] = useTemporaryItem(activeDeputies);

  function handleEditClick(deputy: ActiveDeputy) {
    deputyState.setTempId(deputy.id);
    modalState.openModal(ModalIds.ManageUnit);
  }

  React.useEffect(() => {
    setActiveDeputies(asyncTable.items);
  }, [asyncTable.items]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mb-3 rounded-md card">
      <ActiveDeputiesHeader />
      <ActiveUnitsSearch
        totalCount={initialDeputies.length}
        isLoading={asyncTable.isLoading}
        type="ems-fd"
      />

      {activeDeputies.length <= 0 ? (
        <p className="px-4 py-2 text-neutral-700 dark:text-gray-300">{t("Ems.noActiveDeputies")}</p>
      ) : (
        <Table
          tableState={tableState}
          features={{ isWithinCardOrModal: true }}
          containerProps={{ className: "mb-3 px-4" }}
          data={activeDeputies.map((deputy) => {
            const useDot = user?.statusViewMode === StatusViewMode.DOT_COLOR;
            const nameAndCallsign = `${generateCallsign(deputy)} ${makeUnitName(deputy)}`;

            const backgroundColor = deputy.status?.color;
            const textColor = deputy.status?.textColor;
            const color =
              backgroundColor && !useDot
                ? textColor || generateContrastColor(backgroundColor)
                : textColor;

            return {
              id: deputy.id,
              rowProps: {
                style: {
                  backgroundColor: !useDot && backgroundColor ? backgroundColor : undefined,
                  color,
                },
              },
              name: nameAndCallsign,
              deputy: (
                <DeputyColumn
                  useDot={useDot}
                  textColor={textColor}
                  deputy={deputy}
                  isDispatch={isDispatch}
                  nameAndCallsign={nameAndCallsign}
                  setTempUnit={deputyState.setTempId}
                />
              ),
              badgeNumberString: !isUnitCombinedEmsFd(deputy) && deputy.badgeNumberString,
              department:
                (!isUnitCombinedEmsFd(deputy) && deputy.department?.value.value) ?? common("none"),
              division: !isUnitCombinedEmsFd(deputy) && formatUnitDivisions(deputy),
              rank: (!isUnitCombinedEmsFd(deputy) && deputy.rank?.value) ?? common("none"),
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
              vehicle: deputy.activeVehicle ? (
                <HoverCard>
                  <HoverCardTrigger>{deputy.activeVehicle.value.value}</HoverCardTrigger>
                  <HoverCardContent>
                    {deputy.activeVehicle.description ?? deputy.activeVehicle.value.value}
                  </HoverCardContent>
                </HoverCard>
              ) : (
                common("none")
              ),
              incident: (
                <ActiveIncidentColumn
                  unitId={deputy.id}
                  isDispatch={isDispatch}
                  incidentId={deputy.activeIncidentId}
                />
              ),
              activeCall: (
                <ActiveCallColumn
                  unitId={deputy.id}
                  isDispatch={isDispatch}
                  callId={deputy.activeCallId}
                  size="sm"
                />
              ),
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
            BADGE_NUMBERS
              ? { header: t("Leo.badgeNumber"), accessorKey: "badgeNumberString" }
              : null,
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
      )}

      {tempDeputy ? (
        <ManageUnitModal
          type="ems-fd"
          onClose={() => deputyState.setTempId(null)}
          unit={tempDeputy}
        />
      ) : null}
      {tempDeputy && !isUnitCombinedEmsFd(tempDeputy) ? (
        <MergeUnitModal
          type="ems-fd"
          isDispatch={isDispatch}
          unit={tempDeputy}
          onClose={() => deputyState.setTempId(null)}
          activeUnit={activeDeputy}
          activeUnits={activeDeputies}
          setActiveUnits={setActiveDeputies}
          setActiveUnit={setActiveDeputy}
        />
      ) : null}
    </div>
  );
}

const ActiveDeputiesMemoized = React.memo(ActiveDeputies);
export { ActiveDeputiesMemoized as ActiveDeputies };
