import * as React from "react";
import Head from "next/head";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { makeUnitName, requestAll, yesOrNoText } from "lib/utils";
import { GetServerSideProps } from "next";
import { useTranslations } from "use-intl";
import { useModal } from "context/ModalContext";
import { Button } from "components/Button";
import { ModalIds } from "types/ModalIds";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { LeoIncident } from "types/prisma";
import { FullOfficer, useDispatchState } from "state/dispatchState";
import { format } from "date-fns";
import { useLeoState } from "state/leoState";
import dynamic from "next/dynamic";
import { useImageUrl } from "hooks/useImageUrl";
import { useAuth } from "context/AuthContext";
import useFetch from "lib/useFetch";
import { useRouter } from "next/router";
import { Table } from "components/table/Table";

export type FullIncident = LeoIncident & { creator: FullOfficer; officersInvolved: FullOfficer[] };

interface Props {
  incidents: FullIncident[];
  officers: FullOfficer[];
  activeOfficer: FullOfficer | null;
}

const CreateIncidentModal = dynamic(async () => {
  return (await import("components/leo/modals/CreateIncidentModal")).CreateIncidentModal;
});

const AlertModal = dynamic(async () => {
  return (await import("components/modal/AlertModal")).AlertModal;
});

export default function LeoIncidents({ officers, activeOfficer, incidents }: Props) {
  const [tempIncident, setTempIncident] = React.useState<FullIncident | null>(null);

  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { openModal, closeModal } = useModal();
  const { setAllOfficers } = useDispatchState();
  const { setActiveOfficer } = useLeoState();
  const generateCallsign = useGenerateCallsign();
  const { makeImageUrl } = useImageUrl();
  const { user } = useAuth();
  const { state, execute } = useFetch();
  const router = useRouter();

  const isActive = activeOfficer && activeOfficer?.status?.shouldDo !== "SET_OFF_DUTY";

  function onDeleteClick(incident: FullIncident) {
    openModal(ModalIds.AlertDeleteIncident);
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

  const involvedOfficers = (incident: FullIncident) =>
    incident.officersInvolved?.length <= 0 ? (
      <span>{common("none")}</span>
    ) : (
      incident.officersInvolved?.map((o) => (
        <span key={o.id}>
          {generateCallsign(o)} {makeUnitName(o)}
        </span>
      ))
    );

  return (
    <Layout className="dark:text-white">
      <Head>
        <title>{t("incidents")} - SnailyCAD</title>
      </Head>

      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{t("incidents")}</h1>

        <Button
          title={!isActive ? "You must have an active officer." : ""}
          disabled={!isActive}
          onClick={() => openModal(ModalIds.CreateIncident)}
        >
          {t("createIncident")}
        </Button>
      </header>

      {incidents.length <= 0 ? (
        <p className="mt-5">{t("noIncidents")}</p>
      ) : (
        <Table
          data={incidents.map((incident) => ({
            caseNumber: `#${incident.caseNumber}`,
            officer: (
              <span className="flex items-center">
                {incident.creator.imageId ? (
                  <img
                    className="rounded-md w-[30px] h-[30px] object-cover mr-2"
                    draggable={false}
                    src={makeImageUrl("units", incident.creator.imageId)}
                  />
                ) : null}
                {makeUnitName(incident.creator)}
              </span>
            ),
            involvedOfficers: involvedOfficers(incident),
            firearmsInvolved: common(yesOrNoText(incident.firearmsInvolved)),
            injuriesOrFatalities: common(yesOrNoText(incident.injuriesOrFatalities)),
            arrestsMade: common(yesOrNoText(incident.arrestsMade)),
            description: (
              <span className="block max-w-4xl min-w-[200px] break-words whitespace-pre-wrap">
                {incident.description}
              </span>
            ),
            createdAt: format(new Date(incident.createdAt), "yyyy-MM-dd HH:mm"),
            actions: user?.isSupervisor ? (
              <td>
                <Button small variant="danger" onClick={() => onDeleteClick(incident)}>
                  {common("delete")}
                </Button>
              </td>
            ) : null,
          }))}
          columns={[
            {
              Header: t("caseNumber"),
              accessor: "caseNumber",
            },
            {
              Header: t("officer"),
              accessor: "officer",
            },
            {
              Header: t("involvedOfficers"),
              accessor: "involvedOfficers",
            },
            {
              Header: t("firearmsInvolved"),
              accessor: "firearmsInvolved",
            },
            {
              Header: t("injuriesOrFatalities"),
              accessor: "injuriesOrFatalities",
            },
            {
              Header: t("arrestsMade"),
              accessor: "arrestsMade",
            },
            {
              Header: common("description"),
              accessor: "description",
            },
            {
              Header: common("createdAt"),
              accessor: "createdAt",
            },
            {
              Header: common("actions"),
              accessor: "actions",
            },
          ]}
        />
      )}

      {isActive ? <CreateIncidentModal /> : null}
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
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const [incidents, activeOfficer, { officers }] = await requestAll(req, [
    ["/incidents", []],
    ["/leo/active-officer", null],
    ["/leo", { officers: [] }],
  ]);

  return {
    props: {
      session: await getSessionUser(req),
      incidents,
      activeOfficer,
      officers,
      messages: {
        ...(await getTranslations(["leo", "common"], locale)),
      },
    },
  };
};
