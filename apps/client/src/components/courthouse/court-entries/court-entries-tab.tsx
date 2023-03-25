import { Button, TabsContent } from "@snailycad/ui";
import { useModal } from "state/modalState";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import type { CourtEntry } from "@snailycad/types";
import { FullDate } from "components/shared/FullDate";
import { ManageCourtEntry } from "./manage-court-entry-modal";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import type { DeleteCourtEntriesData, GetCourtEntriesData } from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { CallDescription } from "components/dispatch/active-calls/CallDescription";

export function CourtEntriesTab() {
  const asyncTable = useAsyncTable<CourtEntry>({
    fetchOptions: {
      path: "/court-entries",
      onResponse: (json: GetCourtEntriesData) => ({
        data: json.courtEntries,
        totalCount: json.totalCount,
      }),
    },
  });
  const [tempEntry, entryState] = useTemporaryItem(asyncTable.items);

  const t = useTranslations("Courthouse");
  const common = useTranslations("Common");
  const { openModal, closeModal } = useModal();
  const { state, execute } = useFetch();
  const tableState = useTableState();

  async function deleteCourtEntry() {
    if (!tempEntry) return;

    const { json } = await execute<DeleteCourtEntriesData>({
      path: `/court-entries/${tempEntry.id}`,
      method: "DELETE",
    });

    if (typeof json === "boolean") {
      asyncTable.remove(tempEntry.id);
      entryState.setTempId(null);
      closeModal(ModalIds.AlertDeleteCourtEntry);
    }
  }

  function handleManageClick(entry: CourtEntry) {
    entryState.setTempId(entry.id);
    openModal(ModalIds.ManageCourtEntry);
  }

  function handleDeleteClick(entry: CourtEntry) {
    entryState.setTempId(entry.id);
    openModal(ModalIds.AlertDeleteCourtEntry);
  }

  return (
    <TabsContent value="courtEntriesTab">
      <header className="flex justify-between items-center">
        <h3 className="text-2xl font-semibold">{t("courtEntries")}</h3>

        <Button onPress={() => openModal(ModalIds.ManageCourtEntry)}>{t("addCourtEntry")}</Button>
      </header>

      {!asyncTable.isInitialLoading && asyncTable.items.length <= 0 ? (
        <p className="mt-5">{t("noCourtEntries")}</p>
      ) : (
        <Table
          isLoading={asyncTable.isInitialLoading}
          tableState={tableState}
          data={asyncTable.items.map((entry) => ({
            id: entry.id,
            title: entry.title,
            caseNumber: entry.caseNumber,
            createdAt: <FullDate>{entry.createdAt}</FullDate>,
            description: <CallDescription nonCard data={entry} />,
            actions: (
              <>
                <Button onPress={() => handleManageClick(entry)} size="xs" variant="success">
                  {common("manage")}
                </Button>
                <Button
                  onPress={() => handleDeleteClick(entry)}
                  className="ml-2"
                  size="xs"
                  variant="danger"
                >
                  {common("delete")}
                </Button>
              </>
            ),
          }))}
          columns={[
            { header: t("title"), accessorKey: "title" },
            { header: t("caseNumber"), accessorKey: "caseNumber" },
            { header: common("description"), accessorKey: "description" },
            { header: common("createdAt"), accessorKey: "createdAt" },
            { header: common("actions"), accessorKey: "actions" },
          ]}
        />
      )}

      <AlertModal
        id={ModalIds.AlertDeleteCourtEntry}
        title={t("deleteCourtEntry")}
        description={t("alert_deleteCourtEntry")}
        onDeleteClick={deleteCourtEntry}
        onClose={() => entryState.setTempId(null)}
        state={state}
      />

      <ManageCourtEntry
        courtEntry={tempEntry}
        onCreate={(entry) => asyncTable.prepend(entry)}
        onUpdate={(entry) => {
          asyncTable.update(entry.id, entry);
          entryState.setTempId(null);
        }}
        onClose={() => entryState.setTempId(null)}
      />
    </TabsContent>
  );
}
