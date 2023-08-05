import * as React from "react";
import { useTranslations } from "use-intl";
import { Button, Droppable, FullDate } from "@snailycad/ui";
import { useActiveDispatchers } from "hooks/realtime/use-active-dispatchers";
import { Table, useTableState } from "components/shared/Table";
import { yesOrNoText } from "lib/utils";
import { ModalIds } from "types/modal-ids";
import { useModal } from "state/modalState";
import { useActiveIncidentsTable } from "hooks/realtime/use-active-incidents-table";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { ShouldDoType, type IncidentInvolvedUnit, type LeoIncident } from "@snailycad/types";
import { InvolvedUnitsColumn } from "./active-incidents/InvolvedUnitsColumn";
import { DndActions } from "types/dnd-actions";
import { classNames } from "lib/classNames";
import { useDispatchState } from "state/dispatch/dispatch-state";
import type { PostIncidentsData, PutIncidentByIdData } from "@snailycad/types/api";
import { CallDescription } from "./active-calls/CallDescription";

import dynamic from "next/dynamic";
import { useActiveIncidents } from "hooks/realtime/useActiveIncidents";
import compareDesc from "date-fns/compareDesc";
import { useRouter } from "next/router";
import { usePermission } from "hooks/usePermission";
import { defaultPermissions } from "@snailycad/permissions";
import { useLeoState } from "state/leo-state";
import { useEmsFdState } from "state/ems-fd-state";

const ManageIncidentModal = dynamic(
  async () => (await import("components/leo/incidents/manage-incident-modal")).ManageIncidentModal,
  { ssr: false },
);

export function ActiveIncidents() {
  /**
   * undefined = hide modal. It will otherwise open 2 modals, 1 with the incorrect data.
   */
  const [tempIncident, setTempIncident] = React.useState<LeoIncident | "create" | "hide">("hide");

  const router = useRouter();
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { hasActiveDispatchers } = useActiveDispatchers();
  const { openModal, closeModal } = useModal();
  const { state, execute } = useFetch();
  const draggingUnit = useDispatchState((state) => state.draggingUnit);
  const { hasPermissions } = usePermission();
  const activeOfficer = useLeoState((state) => state.activeOfficer);
  const activeDeputy = useEmsFdState((state) => state.activeDeputy);

  const hasDispatchPermissions = hasPermissions(defaultPermissions.defaultDispatchPermissions);
  const isDispatch = router.pathname === "/dispatch" && hasDispatchPermissions;
  const activeUnit =
    router.pathname === "/officer"
      ? activeOfficer
      : router.pathname === "/ems-fd"
      ? activeDeputy
      : null;
  const isUnitActive =
    activeUnit?.status && activeUnit.status.shouldDo !== ShouldDoType.SET_OFF_DUTY;

  const isUnitAssignedToIncident = (incident: LeoIncident) =>
    incident.unitsInvolved.some((v) => v.unit?.id === activeUnit?.id);

  const asyncTable = useActiveIncidentsTable();
  const { activeIncidents } = useActiveIncidents();

  const tableState = useTableState({
    tableId: "active-incidents",
    pagination: asyncTable.pagination,
  });

  async function handleAssignUnassignToIncident(
    incident: LeoIncident,
    unitId: string,
    type: "assign" | "unassign",
  ) {
    const { json } = await execute<PostIncidentsData<"leo">>({
      path: `/incidents/${type}/${incident.id}`,
      method: "POST",
      data: { unit: unitId },
    });

    if (json.id) {
      asyncTable.update(json.id, json);
    }
  }

  async function handleDismissIncident() {
    if (tempIncident === "create" || tempIncident === "hide") return;

    const { json } = await execute<PutIncidentByIdData<"leo">>({
      path: `/incidents/${tempIncident.id}`,
      method: "PUT",
      data: {
        ...tempIncident,
        unitsInvolved: tempIncident.unitsInvolved.map((v) => v.id),
        isActive: false,
      },
    });

    if (json.id) {
      asyncTable.remove(json.id);

      closeModal(ModalIds.AlertDeleteIncident);
      setTempIncident("hide");
    }
  }

  function onEditClick(incident: LeoIncident) {
    openModal(ModalIds.ManageIncident);
    setTempIncident(incident);
  }

  function onEndClick(incident: LeoIncident) {
    openModal(ModalIds.AlertDeleteIncident);
    setTempIncident(incident);
  }

  function handleCreateIncident() {
    openModal(ModalIds.ManageIncident);
    setTempIncident("create");
  }

  return (
    <div className="mt-3 rounded-md card">
      <header className="flex items-center justify-between p-2 px-4 bg-gray-200 dark:bg-secondary">
        <h1 className="text-xl font-semibold">{t("activeIncidents")}</h1>

        <div>
          <Button
            variant={null}
            className="bg-gray-500 hover:bg-gray-600 dark:border dark:border-quinary dark:bg-tertiary dark:hover:brightness-125 text-white"
            onPress={handleCreateIncident}
            disabled={!hasActiveDispatchers}
          >
            {t("createIncident")}
          </Button>
        </div>
      </header>

      {asyncTable.noItemsAvailable ? (
        <p className="px-4 py-2 text-neutral-700 dark:text-gray-300">{t("noActiveIncidents")}</p>
      ) : (
        <Table
          isLoading={asyncTable.isInitialLoading}
          tableState={tableState}
          features={{ isWithinCardOrModal: true }}
          containerProps={{ className: "mb-3 mx-4" }}
          data={activeIncidents
            .sort((a, b) => compareDesc(new Date(a.updatedAt), new Date(b.updatedAt)))
            .map((incident) => {
              const isUnitAssigned = isUnitAssignedToIncident(incident);

              return {
                id: incident.id,
                caseNumber: `#${incident.caseNumber}`,
                unitsInvolved: (
                  <InvolvedUnitsColumn
                    isDispatch={isDispatch}
                    handleAssignUnassignToIncident={handleAssignUnassignToIncident}
                    incident={incident}
                  />
                ),
                createdAt: <FullDate>{incident.createdAt}</FullDate>,
                firearmsInvolved: common(yesOrNoText(incident.firearmsInvolved)),
                injuriesOrFatalities: common(yesOrNoText(incident.injuriesOrFatalities)),
                arrestsMade: common(yesOrNoText(incident.arrestsMade)),
                situationCode: incident.situationCode?.value.value ?? common("none"),
                description: <CallDescription data={incident} />,
                actions: (
                  <>
                    <Button
                      disabled={isDispatch ? !hasActiveDispatchers : !isUnitActive}
                      size="xs"
                      variant="success"
                      onPress={() => onEditClick(incident)}
                    >
                      {isDispatch ? common("manage") : common("view")}
                    </Button>

                    {isDispatch ? (
                      <Button
                        onPress={() => onEndClick(incident)}
                        disabled={!hasActiveDispatchers}
                        size="xs"
                        variant="danger"
                      >
                        {t("end")}
                      </Button>
                    ) : (
                      <Button
                        size="xs"
                        className="mx-2"
                        isDisabled={!activeUnit}
                        onPress={() => {
                          if (!activeUnit?.id) return;
                          handleAssignUnassignToIncident(
                            incident,
                            activeUnit.id,
                            isUnitAssigned ? "unassign" : "assign",
                          );
                        }}
                      >
                        {isUnitAssigned ? t("unassignToIncident") : t("assignToIncident")}
                      </Button>
                    )}
                  </>
                ),
              };
            })}
          columns={[
            { header: t("caseNumber"), accessorKey: "caseNumber" },
            { header: t("unitsInvolved"), accessorKey: "unitsInvolved" },
            { header: t("firearmsInvolved"), accessorKey: "firearmsInvolved" },
            { header: t("injuriesOrFatalities"), accessorKey: "injuriesOrFatalities" },
            { header: t("arrestsMade"), accessorKey: "arrestsMade" },
            { header: t("situationCode"), accessorKey: "situationCode" },
            { header: common("description"), accessorKey: "description" },
            { header: common("createdAt"), accessorKey: "createdAt" },
            { header: common("actions"), accessorKey: "actions" },
          ]}
        />
      )}

      <Droppable<{ incident: LeoIncident; unit: IncidentInvolvedUnit }>
        onDrop={({ incident, unit }) => {
          if (!unit.unit?.id) return;
          handleAssignUnassignToIncident(incident, unit.unit.id, "unassign");
        }}
        accepts={[DndActions.UnassignUnitFromIncident]}
      >
        <div
          className={classNames(
            "grid place-items-center z-50 border-2 border-slate-500 dark:bg-quinary fixed bottom-3 left-3 right-4 h-60 shadow-sm rounded-md transition-opacity",
            draggingUnit === "incident"
              ? "pointer-events-all opacity-100"
              : "pointer-events-none opacity-0",
          )}
        >
          <p>{t("dropToUnassignFromIncident")}</p>
        </div>
      </Droppable>

      {tempIncident === "hide" ? null : (
        <ManageIncidentModal
          isActive
          isUnitAssigned={
            tempIncident === "create" ? false : isUnitAssignedToIncident(tempIncident)
          }
          type="leo"
          onCreate={(incident) => {
            asyncTable.prepend(incident as LeoIncident);

            if (incident.openModalAfterCreation) {
              setTempIncident(incident as LeoIncident);
              openModal(ModalIds.ManageIncident);
            } else {
              setTempIncident("hide");
            }
          }}
          onUpdate={(old, incident) => {
            if (incident.isActive) {
              asyncTable.update(old.id, incident as LeoIncident);
            } else {
              asyncTable.remove(incident.id);
            }
          }}
          onClose={() => setTempIncident("hide")}
          incident={tempIncident === "create" ? null : tempIncident}
        />
      )}

      <AlertModal
        state={state}
        title={t("endIncident")}
        description={t("alert_endIncident")}
        onDeleteClick={handleDismissIncident}
        id={ModalIds.AlertDeleteIncident}
        deleteText={t("endIncident")}
        onClose={() => setTempIncident("hide")}
      />
    </div>
  );
}
