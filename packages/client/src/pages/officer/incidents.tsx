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
import { FullOfficer } from "state/dispatchState";
import { format } from "date-fns";
import { CreateIncidentModal } from "components/leo/modals/CreateIncidentModal";

export type FullIncident = LeoIncident & { creator: FullOfficer; involvedOfficers: FullOfficer[] };

interface Props {
  incidents: FullIncident[];
}

export default function LeoIncidents({ incidents }: Props) {
  console.log({ incidents });
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { openModal } = useModal();
  const generateCallsign = useGenerateCallsign();

  const handleEditClick = () => void 0;
  const handleDeleteClick = () => void 9;

  const involvedOfficers = "";

  return (
    <Layout>
      <Head>
        <title>{t("incidents")} - SnailyCAD</title>
      </Head>

      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{t("incidents")}</h1>

        <Button onClick={() => openModal(ModalIds.CreateIncident)}>{t("createIncident")}</Button>
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
                <th>{common("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((incident) => (
                <tr key={incident.id}>
                  <td>TODO</td>
                  <td className="capitalize flex items-center">
                    {incident.creator.imageId ? (
                      <img
                        className="rounded-md w-[30px] h-[30px] object-cover mr-2"
                        draggable={false}
                        src={makeImageUrl("units", incident.creator.imageId)}
                      />
                    ) : null}
                    {generateCallsign(incident.creator)} {makeUnitName(incident.creator)}
                  </td>
                  <td>{involvedOfficers}</td>
                  <td>{String(incident.firearmsInvolved)}</td>
                  <td>{String(incident.injuriesOrFatalities)}</td>
                  <td>{String(incident.arrestsMade)}</td>
                  <td>{incident.description}</td>
                  <td>{format(new Date(incident.createdAt), "yyyy-MM-dd HH:mm")}</td>

                  <td className="w-36">
                    <Button small onClick={() => handleEditClick(incident)} variant="success">
                      {common("edit")}
                    </Button>
                    <Button
                      onClick={() => handleDeleteClick(incident)}
                      className="ml-2"
                      variant="danger"
                      small
                    >
                      {common("delete")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* <ManageOfficerModal
        onCreate={(officer) => setOfficers((p) => [officer, ...p])}
        onUpdate={(old, newO) => {
          setOfficers((p) => {
            const idx = p.indexOf(old);
            p[idx] = newO;

            return p;
          });
        }}
        officer={tempOfficer}
        onClose={() => setTempOfficer(null)}
      /> */}

      <CreateIncidentModal />

      {/* <AlertModal
        title={t("deleteOfficer")}
        description={t.rich("alert_deleteOfficer", {
          span: (children) => <span className="font-semibold">{children}</span>,
          officer: tempOfficer && makeUnitName(tempOfficer),
        })}
        id={ModalIds.AlertDeleteOfficer}
        onDeleteClick={handleDeleteOfficer}
        state={state}
        onClose={() => setTempOfficer(null)}
      /> */}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const [incidents] = await requestAll(req, [["/incidents", []]]);

  return {
    props: {
      session: await getSessionUser(req.headers),
      incidents,
      messages: {
        ...(await getTranslations(["leo", "common"], locale)),
      },
    },
  };
};
