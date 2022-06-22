import * as React from "react";
import { TabsContent } from "@radix-ui/react-tabs";
import { ExpungementRequestStatus } from "@snailycad/types";
import { Table } from "components/shared/Table";
import { usePermission, Permissions } from "hooks/usePermission";
import { useTranslations } from "next-intl";
import { getTitles } from "components/courthouse/expungement-requests/RequestExpungement";
import { Button } from "components/Button";
import { FullDate } from "components/shared/FullDate";
import { Status } from "components/shared/Status";
import type { FullRequest } from "src/pages/courthouse";
import useFetch from "lib/useFetch";

interface Props {
  requests: FullRequest[];
}

export function ExpungementRequestsTab({ requests: data }: Props) {
  const [requests, setRequests] = React.useState(data);

  const t = useTranslations();
  const common = useTranslations("Common");

  const { state, execute } = useFetch();
  const pendingRequests = requests.filter((v) => v.status === ExpungementRequestStatus.PENDING);
  const { hasPermissions } = usePermission();
  const hasManagePermissions = hasPermissions([Permissions.ManageExpungementRequests], true);

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
    <TabsContent value="expungement-requests">
      <h3 className="font-semibold text-xl">{t("Management.MANAGE_EXPUNGEMENT_REQUESTS")}</h3>

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
            status: <Status state={request.status}>{request.status.toLowerCase()}</Status>,
            createdAt: <FullDate>{request.createdAt}</FullDate>,
            actions: (
              <>
                <Button
                  disabled={state === "loading"}
                  onClick={() => handleUpdate(request.id, ExpungementRequestStatus.ACCEPTED)}
                  variant="success"
                  size="xs"
                >
                  {common("accept")}
                </Button>
                <Button
                  className="ml-2"
                  disabled={state === "loading"}
                  onClick={() => handleUpdate(request.id, ExpungementRequestStatus.DENIED)}
                  variant="danger"
                  size="xs"
                >
                  {common("decline")}
                </Button>
              </>
            ),
          }))}
          columns={[
            { Header: t("Leo.citizen"), accessor: "citizen" },
            { Header: t("Leo.warrants"), accessor: "warrants" },
            { Header: t("Leo.arrestReports"), accessor: "arrestReports" },
            { Header: t("Leo.tickets"), accessor: "tickets" },
            { Header: t("Leo.status"), accessor: "status" },
            { Header: common("createdAt"), accessor: "createdAt" },
            hasManagePermissions ? { Header: common("actions"), accessor: "actions" } : null,
          ]}
        />
      )}
    </TabsContent>
  );
}
