import * as React from "react";
import { AdminLayout } from "components/admin/AdminLayout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import { useTranslations } from "use-intl";
import { Table } from "components/shared/Table";
import type { FullRequest } from "src/pages/courthouse";
import { getTitles } from "components/courthouse/RequestExpungement";
import { ExpungementRequestStatus } from "@snailycad/types";
import useFetch from "lib/useFetch";
import { Button } from "components/Button";
import { Title } from "components/shared/Title";
import { FullDate } from "components/shared/FullDate";

interface Props {
  requests: FullRequest[];
}

export default function SupervisorPanelPage({ requests: data }: Props) {
  const [requests, setRequests] = React.useState(data);

  const t = useTranslations();
  const common = useTranslations("Common");
  const leo = useTranslations("Leo");
  const pendingRequests = requests.filter((v) => v.status === ExpungementRequestStatus.PENDING);

  const { state, execute } = useFetch();

  async function handleUpdate(id: string, type: ExpungementRequestStatus) {
    const { json } = await execute(`/admin/manage/expungement-requests/${id}`, {
      method: "PUT",
      data: { type },
    });

    if (json) {
      setRequests((p) => p.filter((v) => v.id !== json.id));
    }
  }

  return (
    <AdminLayout>
      <Title>{t("Management.MANAGE_EXPUNGEMENT_REQUESTS")}</Title>

      <h1 className="mb-4 text-3xl font-semibold">{t("Management.MANAGE_EXPUNGEMENT_REQUESTS")}</h1>

      {pendingRequests.length <= 0 ? (
        <p className="my-2">{t("Courthouse.noPendingRequests")}</p>
      ) : (
        <Table
          data={pendingRequests.map((request) => ({
            citizen: `${request.citizen.name} ${request.citizen.surname}`,
            warrants: request.warrants.map((w) => w.description).join(", ") || common("none"),
            arrestReports:
              request.records
                .filter((v) => v.type === "ARREST_REPORT")
                .map((w) => getTitles(w))
                .join(", ") || common("none"),
            tickets:
              request.records
                .filter((v) => v.type === "TICKET")
                .map((w) => getTitles(w))
                .join(", ") || common("none"),
            status: request.status.toLowerCase(),
            createdAt: <FullDate>{request.createdAt}</FullDate>,
            actions: (
              <>
                <Button
                  disabled={state === "loading"}
                  onClick={() => handleUpdate(request.id, ExpungementRequestStatus.ACCEPTED)}
                  variant="success"
                >
                  {common("accept")}
                </Button>
                <Button
                  className="ml-2"
                  disabled={state === "loading"}
                  onClick={() => handleUpdate(request.id, ExpungementRequestStatus.DENIED)}
                  variant="danger"
                >
                  {common("decline")}
                </Button>
              </>
            ),
          }))}
          columns={[
            { Header: leo("citizen"), accessor: "citizen" },
            { Header: leo("warrants"), accessor: "warrants" },
            { Header: leo("arrestReports"), accessor: "arrestReports" },
            { Header: leo("tickets"), accessor: "tickets" },
            { Header: leo("status"), accessor: "status" },
            { Header: common("createdAt"), accessor: "createdAt" },
            { Header: common("actions"), accessor: "actions" },
          ]}
        />
      )}
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const [requests] = await requestAll(req, [["/admin/manage/expungement-requests", []]]);

  return {
    props: {
      requests,
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["admin", "leo", "courthouse", "values", "common"], locale)),
      },
    },
  };
};
