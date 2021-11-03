import * as React from "react";
import Head from "next/head";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { makeImageUrl, makeUnitName, requestAll } from "lib/utils";
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

export type FullIncident = LeoIncident & { creator: FullOfficer; officersInvolved: FullOfficer[] };

interface Props {
  incidents: FullIncident[];
  officers: FullOfficer[];
  activeOfficer: FullOfficer | null;
}

const CreateIncidentModal = dynamic(async () => {
  return (await import("components/leo/modals/CreateIncidentModal")).CreateIncidentModal;
});

export default function LeoIncidents({ officers, activeOfficer, incidents }: Props) {
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { openModal } = useModal();
  const { setAllOfficers } = useDispatchState();
  const { setActiveOfficer } = useLeoState();
  const generateCallsign = useGenerateCallsign();

  const isActive = activeOfficer && activeOfficer?.status?.shouldDo !== "SET_OFF_DUTY";
  const yesOrNoText = (t: boolean) => (t === true ? "yes" : "no");

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
        <div className="overflow-x-auto w-full mt-3">
          <table className="overflow-hidden w-full whitespace-nowrap max-h-64">
            <thead>
              <tr>
                <th>{t("caseNumber")}</th>
                <th>{t("officer")}</th>
                <th>{t("involvedOfficers")}</th>
                <th>{t("firearmsInvolved")}</th>
                <th>{t("injuriesOrFatalities")}</th>
                <th>{t("arrestsMade")}</th>
                <th>{common("description")}</th>
                <th>{common("createdAt")}</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((incident) => (
                <tr key={incident.id}>
                  <td>#{incident.caseNumber}</td>
                  <td className="capitalize">
                    {incident.creator.imageId ? (
                      <img
                        className="rounded-md w-[30px] h-[30px] object-cover mr-2"
                        draggable={false}
                        src={makeImageUrl("units", incident.creator.imageId)}
                      />
                    ) : null}
                    {generateCallsign(incident.creator)} {makeUnitName(incident.creator)}
                  </td>
                  <td>{involvedOfficers(incident)}</td>
                  <td>{common(yesOrNoText(incident.firearmsInvolved))}</td>
                  <td>{common(yesOrNoText(incident.injuriesOrFatalities))}</td>
                  <td>{common(yesOrNoText(incident.arrestsMade))}</td>
                  <td className="max-w-4xl min-w-[200px] break-words whitespace-pre-wrap">
                    {incident.description}
                  </td>
                  <td>{format(new Date(incident.createdAt), "yyyy-MM-dd HH:mm")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isActive ? <CreateIncidentModal /> : null}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const [incidents, activeOfficer, { officers }] = await requestAll(req, [
    ["/incidents", []],
    ["/leo/active-officer", null],
    ["/leo", [{ officers: [] }]],
  ]);

  return {
    props: {
      session: await getSessionUser(req.headers),
      incidents,
      activeOfficer,
      officers,
      messages: {
        ...(await getTranslations(["leo", "common"], locale)),
      },
    },
  };
};
