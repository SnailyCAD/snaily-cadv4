import * as React from "react";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { makeUnitName, requestAll, yesOrNoText } from "lib/utils";
import type { GetServerSideProps } from "next";
import { useTranslations } from "use-intl";
import { useModal } from "context/ModalContext";
import { Button } from "components/Button";
import { ModalIds } from "types/ModalIds";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import type { LeoIncident, Officer } from "@snailycad/types";
import { useDispatchState } from "state/dispatchState";
import { useLeoState } from "state/leoState";
import dynamic from "next/dynamic";
import { useImageUrl } from "hooks/useImageUrl";
import { useAuth } from "context/AuthContext";
import useFetch from "lib/useFetch";
import { useRouter } from "next/router";
import { Table } from "components/shared/Table";
import { Title } from "components/shared/Title";
import { FullDate } from "components/shared/FullDate";

export type FullIncident = LeoIncident & { officersInvolved: Officer[] };

interface Props {
  incidents: FullIncident[];
  officers: Officer[];
  activeOfficer: Officer | null;
}

const ManageIncidentModal = dynamic(async () => {
  return (await import("components/leo/incidents/ManageIncidentModal")).ManageIncidentModal;
});

const AlertModal = dynamic(async () => {
  return (await import("components/modal/AlertModal")).AlertModal;
});

const DescriptionModal = dynamic(
  async () => (await import("components/modal/DescriptionModal/DescriptionModal")).DescriptionModal,
);

export default function LeoIncidents({ officers, activeOfficer, incidents: data }: Props) {
  const [incidents, setIncidents] = React.useState(data);
  const [tempIncident, setTempIncident] = React.useState<FullIncident | null>(null);

  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { openModal, closeModal } = useModal();
  const { setAllOfficers } = useDispatchState();
  const { setActiveOfficer } = useLeoState();
  const { generateCallsign } = useGenerateCallsign();
  const { makeImageUrl } = useImageUrl();
  const { user } = useAuth();
  const { state, execute } = useFetch();
  const router = useRouter();

  const isOfficerOnDuty = activeOfficer && activeOfficer.status?.shouldDo !== "SET_OFF_DUTY";

  function handleViewDescription(incident: FullIncident) {
    setTempIncident(incident);
    openModal(ModalIds.Description);
  }

  function onDeleteClick(incident: FullIncident) {
    openModal(ModalIds.AlertDeleteIncident);
    setTempIncident(incident);
  }

  function onEditClick(incident: FullIncident) {
    openModal(ModalIds.ManageIncident);
    setTempIncident(incident);
  }

  async function handleDelete() {
    if (!tempIncident) return;

    const { json } = await execute(`/incidents/${tempIncident.id}`, {
      method: "DELETE",
    });

    if (json) {
      closeModal(ModalIds.AlertDeleteIncident);
      setTempIncident(null);
      router.replace({
        pathname: router.pathname,
        query: router.query,
      });
    }
  }

  React.useEffect(() => {
    setAllOfficers(officers);
    setActiveOfficer(activeOfficer);
  }, [setAllOfficers, setActiveOfficer, activeOfficer, officers]);

  function involvedOfficers(incident: FullIncident) {
    return incident.officersInvolved.length <= 0 ? (
      <span>{common("none")}</span>
    ) : (
      incident.officersInvolved.map((o) => `${generateCallsign(o)} ${makeUnitName(o)}`).join(", ")
    );
  }

  return (
    <Layout className="dark:text-white">
      <Title>{t("incidents")}</Title>

      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{t("incidents")}</h1>

        <Button
          title={!isOfficerOnDuty ? "You must have an active officer." : ""}
          disabled={!isOfficerOnDuty}
          onClick={() => openModal(ModalIds.ManageIncident)}
        >
          {t("createIncident")}
        </Button>
      </header>

      {incidents.length <= 0 ? (
        <p className="mt-5">{t("noIncidents")}</p>
      ) : (
        <Table
          defaultSort={{
            columnId: "caseNumber",
            descending: true,
          }}
          data={incidents.map((incident) => ({
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
                  small
                  variant="success"
                  className="mr-2"
                  onClick={() => onEditClick(incident)}
                  disabled={!isOfficerOnDuty}
                >
                  {common("edit")}
                </Button>
                {user?.isSupervisor ? (
                  <Button small variant="danger" onClick={() => onDeleteClick(incident)}>
                    {common("delete")}
                  </Button>
                ) : null}
              </>
            ),
          }))}
          columns={[
            { Header: t("caseNumber"), accessor: "caseNumber" },
            { Header: t("officer"), accessor: "officer" },
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

      {isOfficerOnDuty ? (
        <ManageIncidentModal
          onCreate={(incident) => setIncidents((p) => [incident, ...p])}
          onUpdate={(oldIncident, incident) => {
            setIncidents((prev) => {
              const idx = prev.findIndex((i) => i.id === oldIncident.id);
              prev[idx] = { ...oldIncident, ...incident };

              return prev;
            });
          }}
          onClose={() => setTempIncident(null)}
          incident={tempIncident}
        />
      ) : null}
      {user?.isSupervisor ? (
        <AlertModal
          id={ModalIds.AlertDeleteIncident}
          title={t("deleteIncident")}
          description={t("alert_deleteIncident")}
          onDeleteClick={handleDelete}
          onClose={() => setTempIncident(null)}
          state={state}
        />
      ) : null}

      {tempIncident?.descriptionData ? (
        <DescriptionModal
          onClose={() => setTempIncident(null)}
          value={tempIncident.descriptionData}
        />
      ) : null}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const [{ incidents, officers }, activeOfficer, values] = await requestAll(req, [
    ["/incidents", { officers: [], incidents: [] }],
    ["/leo/active-officer", null],
    ["/admin/values/codes_10", []],
  ]);

  return {
    props: {
      session: await getSessionUser(req),
      incidents,
      activeOfficer,
      officers,
      values,
      messages: {
        ...(await getTranslations(["leo", "calls", "common"], locale)),
      },
    },
  };
};
