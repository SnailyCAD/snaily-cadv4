import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "@snailycad/ui";
import compareDesc from "date-fns/compareDesc";
import { useActiveDispatchers } from "hooks/realtime/use-active-dispatchers";
import { Table, useTableState } from "components/shared/Table";
import { yesOrNoText } from "lib/utils";
import { FullDate } from "components/shared/FullDate";
import { ModalIds } from "types/ModalIds";
import { useModal } from "state/modalState";
import { ManageIncidentModal } from "components/leo/incidents/manage-incident-modal";
import { useActiveIncidents } from "hooks/realtime/useActiveIncidents";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import type { LeoIncident } from "@snailycad/types";
import { InvolvedUnitsColumn } from "./active-incidents/InvolvedUnitsColumn";
import { DndActions } from "types/DndActions";
import { classNames } from "lib/classNames";
import { Droppable } from "components/shared/dnd/Droppable";
import { useDispatchState } from "state/dispatch/dispatch-state";
import type { PostIncidentsData, PutIncidentByIdData } from "@snailycad/types/api";
import { CallDescription } from "./active-calls/CallDescription";

export function ActiveIncidents() {
  /**
   * undefined = hide modal. It will otherwise open 2 modals, 1 with the incorrect data.
   */
  const [tempIncident, setTempIncident] = React.useState<LeoIncident | null | undefined>(undefined);

  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { hasActiveDispatchers } = useActiveDispatchers();
  const { openModal, closeModal } = useModal();
  const { activeIncidents, setActiveIncidents } = useActiveIncidents();
  const { state, execute } = useFetch();
  const draggingUnit = useDispatchState((state) => state.draggingUnit);
  const tableState = useTableState({ tableId: "active-incidents" });

  async function handleAssignUnassignToIncident(
    incident: LeoIncident,
    unitId: string,
    type: "assign" | "unassign",
  ) {
    const { json } = await execute<PostIncidentsData>({
      path: `/incidents/${type}/${incident.id}`,
      method: "POST",
      data: { unit: unitId },
    });

    if (json.id) {
      const callsMapped = activeIncidents.map((incident) => {
        if (incident.id === json.id) {
          return { ...incident, ...json };
        }
        return incident;
      });
      setActiveIncidents(callsMapped);
    }
  }

  async function handleDismissIncident() {
    if (!tempIncident) return;

    const { json } = await execute<PutIncidentByIdData>({
      path: `/incidents/${tempIncident.id}`,
      method: "PUT",
      data: {
        ...tempIncident,
        unitsInvolved: tempIncident.unitsInvolved.map((v) => v.id),
        isActive: false,
      },
    });

    if (json.id) {
      setActiveIncidents(activeIncidents.filter((v) => v.id !== tempIncident.id));
      closeModal(ModalIds.AlertDeleteIncident);
      setTempIncident(undefined);
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
    setTempIncident(null);
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

      {activeIncidents.length <= 0 ? (
        <p className="px-4 py-2 text-neutral-700 dark:text-gray-300">{t("noActiveIncidents")}</p>
      ) : (
        <Table
          tableState={tableState}
          features={{ isWithinCardOrModal: true }}
          containerProps={{ className: "mb-3 mx-4" }}
          data={activeIncidents
            .sort((a, b) => compareDesc(new Date(a.updatedAt), new Date(b.updatedAt)))
            .map((incident) => {
              return {
                id: incident.id,
                caseNumber: `#${incident.caseNumber}`,
                unitsInvolved: (
                  <InvolvedUnitsColumn
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
                      onPress={() => onEditClick(incident)}
                      disabled={!hasActiveDispatchers}
                      size="xs"
                      variant="success"
                    >
                      {common("manage")}
                    </Button>

                    <Button
                      onPress={() => onEndClick(incident)}
                      disabled={!hasActiveDispatchers}
                      size="xs"
                      variant="danger"
                      className="ml-2"
                    >
                      {t("end")}
                    </Button>
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

      <Droppable
        onDrop={({ incident, unit }) =>
          handleAssignUnassignToIncident(incident, unit.unit?.id, "unassign")
        }
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

      {typeof tempIncident === "undefined" ? null : (
        <ManageIncidentModal
          onCreate={(incident) => {
            setActiveIncidents([incident, ...activeIncidents]);
            setTempIncident(undefined);
          }}
          onUpdate={(old, incident) => {
            if (incident.isActive) {
              setActiveIncidents(
                activeIncidents.map((v) => {
                  if (v.id === old.id) {
                    return { ...v, ...incident };
                  }
                  return v;
                }),
              );
            } else {
              setActiveIncidents(activeIncidents.filter((v) => v.id !== incident.id));
            }
          }}
          onClose={() => setTempIncident(undefined)}
          incident={tempIncident}
        />
      )}

      <AlertModal
        state={state}
        title={t("endIncident")}
        description={t("alert_endIncident")}
        onDeleteClick={handleDismissIncident}
        id={ModalIds.AlertDeleteIncident}
        deleteText={t("endIncident")}
        onClose={() => setTempIncident(undefined)}
      />
    </div>
  );
}
