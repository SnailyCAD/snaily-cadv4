import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { useRouter } from "next/router";
import { useActiveDispatchers } from "hooks/realtime/useActiveDispatchers";
import { Table } from "components/shared/Table";
import type { FullIncident } from "src/pages/officer/incidents";
import { makeUnitName, yesOrNoText } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { useImageUrl } from "hooks/useImageUrl";
import { FullDate } from "components/shared/FullDate";
import { ModalIds } from "types/ModalIds";
import { useModal } from "context/ModalContext";
import { DescriptionModal } from "components/modal/DescriptionModal/DescriptionModal";
import { ManageIncidentModal } from "components/leo/modals/ManageIncidentModal";
import { useActiveIncidents } from "hooks/realtime/useActiveIncidents";
import compareDesc from "date-fns/compareDesc";

export function ActiveIncidents() {
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { hasActiveDispatchers } = useActiveDispatchers();
  const generateCallsign = useGenerateCallsign();
  const { makeImageUrl } = useImageUrl();
  const { openModal } = useModal();
  const { activeIncidents, setActiveIncidents } = useActiveIncidents();

  const router = useRouter();
  const isDispatch = router.pathname === "/dispatch";
  const [tempIncident, setTempIncident] = React.useState<FullIncident | null>(null);

  function handleViewDescription(incident: FullIncident) {
    setTempIncident(incident);
    openModal(ModalIds.Description);
  }

  function onEditClick(incident: FullIncident) {
    openModal(ModalIds.ManageIncident);
    setTempIncident(incident);
  }

  function involvedOfficers(incident: FullIncident) {
    return incident.officersInvolved.length <= 0 ? (
      <span>{common("none")}</span>
    ) : (
      incident.officersInvolved.map((o) => `${generateCallsign(o)} ${makeUnitName(o)}`).join(", ")
    );
  }

  return (
    <div className="overflow-hidden rounded-md bg-gray-200/80 dark:bg-gray-2 mt-3">
      <header className="flex items-center justify-between p-2 px-4 bg-gray-300/50 dark:bg-gray-3">
        <h3 className="text-xl font-semibold">{t("activeIncidents")}</h3>

        <div>
          <Button
            variant={null}
            className="bg-gray-2 hover:bg-dark-bg"
            onClick={() => openModal(ModalIds.ManageIncident)}
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
          containerProps={{ className: "mb-3 px-4" }}
          data={activeIncidents
            .sort((a, b) => compareDesc(new Date(a.updatedAt), new Date(b.updatedAt)))
            .map((incident) => {
              return {
                caseNumber: `#${incident.caseNumber}`,
                officer: (
                  <span className="flex items-center">
                    {incident.creator?.imageId ? (
                      <img
                        className="rounded-md w-[30px] h-[30px] object-cover mr-2"
                        draggable={false}
                        src={makeImageUrl("units", incident.creator.imageId)}
                      />
                    ) : null}
                    {incident.creator ? makeUnitName(incident.creator) : t("dispatch")}
                  </span>
                ),
                involvedOfficers: involvedOfficers(incident),
                firearmsInvolved: common(yesOrNoText(incident.firearmsInvolved)),
                injuriesOrFatalities: common(yesOrNoText(incident.injuriesOrFatalities)),
                arrestsMade: common(yesOrNoText(incident.arrestsMade)),
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
                actions: isDispatch ? (
                  <>
                    <Button
                      onClick={() => onEditClick(incident)}
                      disabled={!hasActiveDispatchers}
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
            { Header: t("caseNumber"), accessor: "caseNumber" },
            { Header: t("officer"), accessor: "officer" },
            { Header: t("involvedOfficers"), accessor: "involvedOfficers" },
            { Header: t("firearmsInvolved"), accessor: "firearmsInvolved" },
            { Header: t("injuriesOrFatalities"), accessor: "injuriesOrFatalities" },
            { Header: t("arrestsMade"), accessor: "arrestsMade" },
            { Header: common("description"), accessor: "description" },
            { Header: common("createdAt"), accessor: "createdAt" },
            { Header: common("actions"), accessor: "actions" },
          ]}
        />
      )}

      {tempIncident?.descriptionData ? (
        <DescriptionModal
          onClose={() => setTempIncident(null)}
          value={tempIncident.descriptionData}
        />
      ) : null}

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
        onClose={() => setTempIncident(null)}
        incident={tempIncident}
      />
    </div>
  );
}
