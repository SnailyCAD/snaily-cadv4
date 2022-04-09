import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import compareDesc from "date-fns/compareDesc";
import { useActiveDispatchers } from "hooks/realtime/useActiveDispatchers";
import { Table } from "components/shared/Table";
import type { FullIncident } from "src/pages/officer/incidents";
import { makeUnitName, yesOrNoText } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { FullDate } from "components/shared/FullDate";
import { ModalIds } from "types/ModalIds";
import { useModal } from "context/ModalContext";
import { DescriptionModal } from "components/modal/DescriptionModal/DescriptionModal";
import { ManageIncidentModal } from "components/leo/incidents/ManageIncidentModal";
import { useActiveIncidents } from "hooks/realtime/useActiveIncidents";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";

export function ActiveIncidents() {
  /**
   * undefined = hide modal. It will otherwise open 2 modals, 1 with the incorrect data.
   */
  const [tempIncident, setTempIncident] = React.useState<FullIncident | null | undefined>(
    undefined,
  );

  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { hasActiveDispatchers } = useActiveDispatchers();
  const { generateCallsign } = useGenerateCallsign();
  const { openModal, closeModal } = useModal();
  const { activeIncidents, setActiveIncidents } = useActiveIncidents();
  const { state, execute } = useFetch();

  async function handleDismissIncident() {
    if (!tempIncident) return;

    const { json } = await execute(`/incidents/${tempIncident.id}`, {
      method: "PUT",
      data: {
        ...tempIncident,
        involvedOfficers: tempIncident.officersInvolved.map((v) => v.id),
        isActive: false,
      },
    });

    if (json.id) {
      setActiveIncidents(activeIncidents.filter((v) => v.id !== tempIncident.id));
      closeModal(ModalIds.AlertDeleteIncident);
      setTempIncident(undefined);
    }
  }

  function handleViewDescription(incident: FullIncident) {
    setTempIncident(incident);
    openModal(ModalIds.Description);
  }

  function onEditClick(incident: FullIncident) {
    openModal(ModalIds.ManageIncident);
    setTempIncident(incident);
  }

  function onEndClick(incident: FullIncident) {
    openModal(ModalIds.AlertDeleteIncident);
    setTempIncident(incident);
  }

  function handleCreateIncident() {
    openModal(ModalIds.ManageIncident);
    setTempIncident(null);
  }

  function involvedOfficers(incident: FullIncident) {
    return (incident.officersInvolved?.length ?? 0) <= 0 ? (
      <span>{common("none")}</span>
    ) : (
      incident.officersInvolved.map((o) => `${generateCallsign(o)} ${makeUnitName(o)}`).join(", ")
    );
  }

  return (
    <div className="mt-3 overflow-hidden rounded-md bg-gray-200/80 dark:bg-gray-2">
      <header className="flex items-center justify-between p-2 px-4 bg-gray-300/50 dark:bg-gray-3">
        <h3 className="text-xl font-semibold">{t("activeIncidents")}</h3>

        <div>
          <Button
            variant={null}
            className="dark:bg-gray-2 dark:hover:bg-dark-bg bg-gray-500 hover:bg-gray-600 text-white"
            onClick={handleCreateIncident}
            disabled={!hasActiveDispatchers}
          >
            {t("createIncident")}
          </Button>
        </div>
      </header>

      {activeIncidents.length <= 0 ? (
        <p className="px-4 py-2">{t("noActiveIncidents")}</p>
      ) : (
        <Table
          isWithinCard
          containerProps={{ className: "mb-3 mx-4" }}
          data={activeIncidents
            .sort((a, b) => compareDesc(new Date(a.updatedAt), new Date(b.updatedAt)))
            .map((incident) => {
              return {
                caseNumber: `#${incident.caseNumber}`,
                involvedOfficers: involvedOfficers(incident),
                firearmsInvolved: common(yesOrNoText(incident.firearmsInvolved)),
                injuriesOrFatalities: common(yesOrNoText(incident.injuriesOrFatalities)),
                arrestsMade: common(yesOrNoText(incident.arrestsMade)),
                situationCode: incident.situationCode?.value.value ?? common("none"),
                description: (
                  <span className="block max-w-4xl min-w-[200px] break-words whitespace-pre-wrap">
                    {incident.description && !incident.descriptionData ? (
                      incident.description
                    ) : (
                      <Button small onClick={() => handleViewDescription(incident)}>
                        {common("viewDescription")}
                      </Button>
                    )}
                  </span>
                ),
                createdAt: <FullDate>{incident.createdAt}</FullDate>,
                actions: (
                  <>
                    <Button
                      onClick={() => onEditClick(incident)}
                      disabled={!hasActiveDispatchers}
                      small
                      variant="success"
                    >
                      {common("manage")}
                    </Button>

                    <Button
                      onClick={() => onEndClick(incident)}
                      disabled={!hasActiveDispatchers}
                      small
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
            { Header: t("caseNumber"), accessor: "caseNumber" },
            { Header: t("involvedOfficers"), accessor: "involvedOfficers" },
            { Header: t("firearmsInvolved"), accessor: "firearmsInvolved" },
            { Header: t("injuriesOrFatalities"), accessor: "injuriesOrFatalities" },
            { Header: t("arrestsMade"), accessor: "arrestsMade" },
            { Header: t("situationCode"), accessor: "situationCode" },
            { Header: common("description"), accessor: "description" },
            { Header: common("createdAt"), accessor: "createdAt" },
            { Header: common("actions"), accessor: "actions" },
          ]}
        />
      )}

      {tempIncident?.descriptionData ? (
        <DescriptionModal
          onClose={() => setTempIncident(undefined)}
          value={tempIncident.descriptionData}
        />
      ) : null}

      {typeof tempIncident === "undefined" ? null : (
        <ManageIncidentModal
          onCreate={(incident) => {
            setActiveIncidents([incident, ...activeIncidents]);
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
