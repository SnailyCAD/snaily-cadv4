import { TabsContent } from "@radix-ui/react-tabs";
import { Warrant, WhitelistStatus } from "@snailycad/types";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import { useTranslations } from "next-intl";
import { Button } from "@snailycad/ui";
import { FullDate } from "components/shared/FullDate";
import useFetch from "lib/useFetch";
import type { GetManagePendingWarrants, PutManagePendingWarrants } from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { CreateWarrantModal } from "components/leo/modals/CreateWarrantModal";
import { CallDescription } from "components/dispatch/active-calls/CallDescription";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { makeUnitName } from "lib/utils";
import { useInvalidateQuery } from "hooks/use-invalidate-query";

type PendingWarrant = GetManagePendingWarrants["pendingWarrants"][number];

export function PendingWarrantsTab() {
  const { openModal } = useModal();
  const t = useTranslations();
  const common = useTranslations("Common");
  const tableState = useTableState();
  const { state, execute } = useFetch();
  const { generateCallsign } = useGenerateCallsign();
  const { invalidateQuery } = useInvalidateQuery(["admin", "notifications"]);

  const asyncTable = useAsyncTable<PendingWarrant>({
    fetchOptions: {
      onResponse: (data: GetManagePendingWarrants) => ({
        data: data.pendingWarrants,
        totalCount: data.totalCount,
      }),
      path: "/admin/manage/pending-warrants",
    },
  });
  const [tempWarrant, warrantState] = useTemporaryItem(asyncTable.items);

  function handleViewWarrant(warrant: Warrant) {
    warrantState.setTempId(warrant.id);
    openModal(ModalIds.CreateWarrant, { isActive: true });
  }

  async function handleUpdate(id: string, type: WhitelistStatus) {
    const { json } = await execute<PutManagePendingWarrants>({
      path: `/admin/manage/pending-warrants/${id}`,
      method: "PUT",
      data: { type },
    });

    if (typeof json === "boolean" && json) {
      invalidateQuery();

      asyncTable.remove(id);
      warrantState.setTempId(null);
    }
  }

  return (
    <TabsContent value="pending-warrants">
      <h3 className="font-semibold text-xl">{t("Management.MANAGE_PENDING_WARRANTS")}</h3>

      {!asyncTable.isInitialLoading && asyncTable.items.length <= 0 ? (
        <p className="my-2">{t("Courthouse.noNameChangeRequests")}</p>
      ) : (
        <Table
          isLoading={asyncTable.isInitialLoading}
          tableState={tableState}
          data={asyncTable.items.map((warrant) => {
            const nameAndCallsign = `${generateCallsign(warrant.officer)} ${makeUnitName(
              warrant.officer,
            )}`;

            return {
              id: warrant.id,
              description: <CallDescription nonCard data={warrant} />,
              officer: nameAndCallsign,
              createdAt: <FullDate>{warrant.createdAt}</FullDate>,
              actions: (
                <>
                  <Button onPress={() => handleViewWarrant(warrant)} size="xs">
                    View Warrant
                  </Button>
                  <Button
                    disabled={state === "loading"}
                    onPress={() => handleUpdate(warrant.id, WhitelistStatus.ACCEPTED)}
                    variant="success"
                    size="xs"
                    className="ml-2"
                  >
                    {common("accept")}
                  </Button>
                  <Button
                    className="ml-2"
                    disabled={state === "loading"}
                    onPress={() => handleUpdate(warrant.id, WhitelistStatus.DECLINED)}
                    variant="danger"
                    size="xs"
                  >
                    {common("decline")}
                  </Button>
                </>
              ),
            };
          })}
          columns={[
            { header: common("description"), accessorKey: "description" },
            { header: t("Courthouse.createdBy"), accessorKey: "officer" },
            { header: common("createdAt"), accessorKey: "createdAt" },
            { header: common("actions"), accessorKey: "actions" },
          ]}
        />
      )}

      <CreateWarrantModal
        onClose={() => warrantState.setTempId(null)}
        readOnly
        warrant={tempWarrant}
      />
    </TabsContent>
  );
}
