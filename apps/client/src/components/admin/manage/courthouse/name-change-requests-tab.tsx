import { WhitelistStatus } from "@snailycad/types";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import { usePermission, Permissions } from "hooks/usePermission";
import { useTranslations } from "next-intl";
import { Button, FullDate, Status, TabsContent } from "@snailycad/ui";
import useFetch from "lib/useFetch";
import type {
  GetManageNameChangeRequests,
  PutManageNameChangeRequests,
} from "@snailycad/types/api";
import { useInvalidateQuery } from "hooks/use-invalidate-query";
import { CallDescription } from "components/dispatch/active-calls/CallDescription";

interface Props {
  requests: GetManageNameChangeRequests;
}

export function NameChangeRequestsTab({ requests: data }: Props) {
  const t = useTranslations();
  const common = useTranslations("Common");
  const tableState = useTableState();
  const { state, execute } = useFetch();
  const { hasPermissions } = usePermission();
  const hasManagePermissions = hasPermissions([Permissions.ManageNameChangeRequests]);
  const { invalidateQuery } = useInvalidateQuery(["admin", "notifications"]);

  const asyncTable = useAsyncTable({
    fetchOptions: {
      onResponse: (data: GetManageNameChangeRequests) => ({
        data: data.pendingNameChangeRequests,
        totalCount: data.totalCount,
      }),
      path: "/admin/manage/name-change-requests",
    },
    initialData: data.pendingNameChangeRequests,
    totalCount: data.totalCount,
  });

  async function handleUpdate(id: string, type: WhitelistStatus) {
    const { json } = await execute<PutManageNameChangeRequests>({
      path: `/admin/manage/name-change-requests/${id}`,
      method: "PUT",
      data: { type },
    });

    if (json) {
      asyncTable.remove(id);
      await invalidateQuery();
    }
  }

  return (
    <TabsContent
      tabName={`${t("Management.MANAGE_NAME_CHANGE_REQUESTS")} ${
        asyncTable.isInitialLoading ? "" : ` (${asyncTable.pagination.totalDataCount})`
      }`}
      value="name-change-requests"
    >
      <h3 className="font-semibold text-xl">{t("Management.MANAGE_NAME_CHANGE_REQUESTS")}</h3>

      {asyncTable.noItemsAvailable ? (
        <p className="my-2">{t("Courthouse.noNameChangeRequests")}</p>
      ) : (
        <Table
          tableState={tableState}
          data={asyncTable.items.map((request) => ({
            id: request.id,
            citizen: `${request.citizen.name} ${request.citizen.surname}`,
            newName: `${request.newName} ${request.newSurname}`,
            description: <CallDescription data={{ description: request.description }} />,
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
            { header: common("description"), accessorKey: "description" },
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
