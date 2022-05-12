import * as React from "react";
import { TabsContent } from "@radix-ui/react-tabs";
import { NameChangeRequest, WhitelistStatus } from "@snailycad/types";
import { Table } from "components/shared/Table";
import { usePermission, Permissions } from "hooks/usePermission";
import { useTranslations } from "next-intl";
import { Button } from "components/Button";
import { FullDate } from "components/shared/FullDate";
import { Status } from "components/shared/Status";
import useFetch from "lib/useFetch";

interface Props {
  requests: NameChangeRequest[];
}

export function NameChangeRequestsTab({ requests: data }: Props) {
  const [requests, setRequests] = React.useState(data);

  const t = useTranslations();
  const common = useTranslations("Common");

  const { state, execute } = useFetch();
  const pendingRequests = requests.filter((v) => v.status === WhitelistStatus.PENDING);
  const { hasPermissions } = usePermission();
  const hasManagePermissions = hasPermissions([Permissions.ManageNameChangeRequests], true);

  async function handleUpdate(id: string, type: WhitelistStatus) {
    const { json } = await execute(`/admin/manage/name-change-requests/${id}`, {
      method: "PUT",
      data: { type },
    });

    if (json) {
      setRequests((p) => p.filter((v) => v.id !== json.id));
    }
  }

  return (
    <TabsContent value="name-change-requests">
      <h3 className="font-semibold text-xl">{t("Management.MANAGE_NAME_CHANGE_REQUESTS")}</h3>

      {pendingRequests.length <= 0 ? (
        <p className="my-2">{t("Courthouse.noNameChangeRequests")}</p>
      ) : (
        <Table
          data={pendingRequests.map((request) => ({
            citizen: `${request.citizen.name} ${request.citizen.surname}`,
            newName: `${request.newName} ${request.newSurname}`,
            status: <Status state={request.status}>{request.status.toLowerCase()}</Status>,
            createdAt: <FullDate>{request.createdAt}</FullDate>,
            actions: (
              <>
                <Button
                  disabled={state === "loading"}
                  onClick={() => handleUpdate(request.id, WhitelistStatus.ACCEPTED)}
                  variant="success"
                  small
                >
                  {common("accept")}
                </Button>
                <Button
                  className="ml-2"
                  disabled={state === "loading"}
                  onClick={() => handleUpdate(request.id, WhitelistStatus.DECLINED)}
                  variant="danger"
                  small
                >
                  {common("decline")}
                </Button>
              </>
            ),
          }))}
          columns={[
            { Header: common("citizen"), accessor: "citizen" },
            { Header: t("Courthouse.newName"), accessor: "newName" },
            { Header: t("Courthouse.status"), accessor: "status" },
            { Header: common("createdAt"), accessor: "createdAt" },
            hasManagePermissions ? { Header: common("actions"), accessor: "actions" } : null,
          ]}
        />
      )}
    </TabsContent>
  );
}
