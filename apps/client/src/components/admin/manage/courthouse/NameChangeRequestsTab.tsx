import * as React from "react";
import { TabsContent } from "@radix-ui/react-tabs";
import { WhitelistStatus } from "@snailycad/types";
import { Table, useTableState } from "components/shared/Table";
import { usePermission, Permissions } from "hooks/usePermission";
import { useTranslations } from "next-intl";
import { Button } from "@snailycad/ui";
import { FullDate } from "components/shared/FullDate";
import { Status } from "components/shared/Status";
import useFetch from "lib/useFetch";
import type {
  GetManageNameChangeRequests,
  PutManageNameChangeRequests,
} from "@snailycad/types/api";

interface Props {
  requests: GetManageNameChangeRequests;
}

export function NameChangeRequestsTab({ requests: data }: Props) {
  const [requests, setRequests] = React.useState(data);

  const t = useTranslations();
  const common = useTranslations("Common");
  const tableState = useTableState();
  const { state, execute } = useFetch();
  const pendingRequests = requests.filter((v) => v.status === WhitelistStatus.PENDING);
  const { hasPermissions } = usePermission();
  const hasManagePermissions = hasPermissions([Permissions.ManageNameChangeRequests], true);

  async function handleUpdate(id: string, type: WhitelistStatus) {
    const { json } = await execute<PutManageNameChangeRequests>({
      path: `/admin/manage/name-change-requests/${id}`,
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
          tableState={tableState}
          data={pendingRequests.map((request) => ({
            id: request.id,
            citizen: `${request.citizen.name} ${request.citizen.surname}`,
            newName: `${request.newName} ${request.newSurname}`,
            status: <Status>{request.status}</Status>,
            createdAt: <FullDate>{request.createdAt}</FullDate>,
            actions: (
              <>
                <Button
                  disabled={state === "loading"}
                  onPress={() => handleUpdate(request.id, WhitelistStatus.ACCEPTED)}
                  variant="success"
                  size="xs"
                >
                  {common("accept")}
                </Button>
                <Button
                  className="ml-2"
                  disabled={state === "loading"}
                  onPress={() => handleUpdate(request.id, WhitelistStatus.DECLINED)}
                  variant="danger"
                  size="xs"
                >
                  {common("decline")}
                </Button>
              </>
            ),
          }))}
          columns={[
            { header: common("citizen"), accessorKey: "citizen" },
            { header: t("Courthouse.newName"), accessorKey: "newName" },
            { header: t("Courthouse.status"), accessorKey: "status" },
            { header: common("createdAt"), accessorKey: "createdAt" },
            hasManagePermissions ? { header: common("actions"), accessorKey: "actions" } : null,
          ]}
        />
      )}
    </TabsContent>
  );
}
