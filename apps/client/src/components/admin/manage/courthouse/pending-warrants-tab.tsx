import * as React from "react";
import { TabsContent } from "@radix-ui/react-tabs";
import { Warrant, WhitelistStatus } from "@snailycad/types";
import { Table, useTableState } from "components/shared/Table";
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

interface Props {
  warrants: GetManagePendingWarrants;
}

export function PendingWarrantsTab({ warrants: data }: Props) {
  const [warrants, setWarrants] = React.useState(data);
  const [tempWarrant, warrantState] = useTemporaryItem(warrants);

  const { openModal } = useModal();
  const t = useTranslations();
  const common = useTranslations("Common");
  const tableState = useTableState();
  const { state, execute } = useFetch();
  const { generateCallsign } = useGenerateCallsign();

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
      setWarrants((p) => p.filter((v) => v.id !== id));
      warrantState.setTempId(null);
    }
  }

  return (
    <TabsContent value="pending-warrants">
      <h3 className="font-semibold text-xl">{t("Management.MANAGE_PENDING_WARRANTS")}</h3>

      {warrants.length <= 0 ? (
        <p className="my-2">{t("Courthouse.noNameChangeRequests")}</p>
      ) : (
        <Table
          tableState={tableState}
          data={warrants.map((warrant) => {
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
