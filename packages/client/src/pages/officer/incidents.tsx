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
import type { EmsFdDeputy, LeoIncident, Officer } from "@snailycad/types";
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
import { usePermission, Permissions } from "hooks/usePermission";
import { isUnitCombined } from "@snailycad/utils";

interface Props {
  incidents: LeoIncident[];
  officers: Officer[];
  deputies: EmsFdDeputy[];
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

export default function LeoIncidents({
  officers,
  deputies,
  activeOfficer,
  incidents: data,
}: Props) {
  const [incidents, setIncidents] = React.useState(data);
  const [tempIncident, setTempIncident] = React.useState<LeoIncident | null>(null);

  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { openModal, closeModal } = useModal();
  const dispatchState = useDispatchState();
  const { setActiveOfficer } = useLeoState();
  const { generateCallsign } = useGenerateCallsign();
  const { makeImageUrl } = useImageUrl();
  const { user } = useAuth();
  const { state, execute } = useFetch();
  const router = useRouter();
  const { hasPermissions } = usePermission();

  const isOfficerOnDuty = activeOfficer && activeOfficer.status?.shouldDo !== "SET_OFF_DUTY";

  function handleViewDescription(incident: LeoIncident) {
    setTempIncident(incident);
    openModal(ModalIds.Description);
  }

  function onDeleteClick(incident: LeoIncident) {
    openModal(ModalIds.AlertDeleteIncident);
    setTempIncident(incident);
  }

  function onEditClick(incident: LeoIncident) {
    openModal(ModalIds.ManageIncident);
    setTempIncident(incident);
  }

  function makeAssignedUnit(unit: any) {
    return isUnitCombined(unit.unit)
      ? generateCallsign(unit.unit, "pairedUnitTemplate")
      : `${generateCallsign(unit.unit)} ${makeUnitName(unit.unit)}`;
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
    dispatchState.setAllOfficers(officers);
    dispatchState.setAllDeputies(deputies);
    setActiveOfficer(activeOfficer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setActiveOfficer, activeOfficer, deputies, officers]);

  return (
    <Layout
      permissions={{
        fallback: (u) => u.isLeo,
        permissions: [Permissions.ViewIncidents, Permissions.ManageIncidents],
      }}
      className="dark:text-white"
    >
      <Title>{t("incidents")}</Title>

      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{t("incidents")}</h1>

        {hasPermissions([Permissions.ManageIncidents], true) ? (
          <Button
            title={!isOfficerOnDuty ? "You must have an active officer." : ""}
            disabled={!isOfficerOnDuty}
            onClick={() => openModal(ModalIds.ManageIncident)}
          >
            {t("createIncident")}
          </Button>
        ) : null}
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
            unitsInvolved:
              incident.unitsInvolved.map(makeAssignedUnit).join(", ") || common("none"),
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
                {hasPermissions([Permissions.ManageIncidents], true) ? (
                  <Button
                    small
                    variant="success"
                    className="mr-2"
                    onClick={() => onEditClick(incident)}
                    disabled={!isOfficerOnDuty}
                  >
                    {common("edit")}
                  </Button>
                ) : null}

                {hasPermissions([Permissions.ManageIncidents], user?.isSupervisor ?? false) ? (
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
            { Header: t("unitsInvolved"), accessor: "unitsInvolved" },
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

      {isOfficerOnDuty && hasPermissions([Permissions.ManageIncidents], true) ? (
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

      {hasPermissions([Permissions.ManageIncidents], user?.isSupervisor ?? false) ? (
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
  const [{ incidents }, { officers, deputies }, activeOfficer, values] = await requestAll(req, [
    ["/incidents", { incidents: [] }],
    ["/dispatch", { deputies: [], officers: [] }],
    ["/leo/active-officer", null],
    ["/admin/values/codes_10", []],
  ]);

  return {
    props: {
      session: await getSessionUser(req),
      incidents,
      activeOfficer,
      officers,
      deputies,
      values,
      messages: {
        ...(await getTranslations(["leo", "calls", "common"], locale)),
      },
    },
  };
};
