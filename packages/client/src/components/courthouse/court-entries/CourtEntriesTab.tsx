import * as React from "react";
import { Button } from "components/Button";
import { TabsContent } from "components/shared/TabList";
import { useModal } from "state/modalState";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { Table } from "components/shared/Table";
import type { CourtEntry } from "@snailycad/types";
import { FullDate } from "components/shared/FullDate";
import { ManageCourtEntry } from "./ManageCourtEntry";
import { DescriptionModal } from "components/modal/DescriptionModal/DescriptionModal";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import type { DeleteCourtEntriesData, GetCourtEntriesData } from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";

interface Props {
  entries: GetCourtEntriesData;
}

export function CourtEntriesTab(props: Props) {
  const [entries, setEntries] = React.useState(props.entries);
  const [tempEntry, entryState] = useTemporaryItem(entries);

  const t = useTranslations("Courthouse");
  const common = useTranslations("Common");
  const { openModal, closeModal } = useModal();
  const { state, execute } = useFetch();

  async function deleteCourtEntry() {
    if (!tempEntry) return;

    const { json } = await execute<DeleteCourtEntriesData>({
      path: `/court-entries/${tempEntry.id}`,
      method: "DELETE",
    });

    if (typeof json === "boolean") {
      setEntries((p) => p.filter((v) => v.id !== tempEntry.id));
      entryState.setTempId(null);
      closeModal(ModalIds.AlertDeleteCourtEntry);
    }
  }

  function handleViewDescription(entry: CourtEntry) {
    entryState.setTempId(entry.id);
    openModal(ModalIds.Description, entry);
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

        <Button onClick={() => openModal(ModalIds.ManageCourtEntry)}>{t("addCourtEntry")}</Button>
      </header>

      {entries.length <= 0 ? (
        <p className="mt-5">{t("noCourtEntries")}</p>
      ) : (
        <Table
          defaultSort={{ columnId: "createdAt", descending: true }}
          data={entries.map((entry) => ({
            title: entry.title,
            caseNumber: entry.caseNumber,
            createdAt: <FullDate>{entry.createdAt}</FullDate>,
            description: (
              <Button size="xs" onClick={() => handleViewDescription(entry)}>
                {common("viewDescription")}
              </Button>
            ),
            actions: (
              <>
                <Button onClick={() => handleManageClick(entry)} size="xs" variant="success">
                  {common("manage")}
                </Button>
                <Button
                  onClick={() => handleDeleteClick(entry)}
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
            { Header: t("title"), accessor: "title" },
            { Header: t("caseNumber"), accessor: "caseNumber" },
            { Header: common("description"), accessor: "description" },
            { Header: common("createdAt"), accessor: "createdAt" },
            { Header: common("actions"), accessor: "actions" },
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
        onCreate={(entry) => setEntries((p) => [entry, ...p])}
        onUpdate={(entry) =>
          tempEntry &&
          setEntries((p) => {
            const idx = p.indexOf(tempEntry);
            p[idx] = entry;
            return p;
          })
        }
        onClose={() => entryState.setTempId(null)}
      />
      {tempEntry?.descriptionData ? (
        <DescriptionModal
          onClose={() => entryState.setTempId(null)}
          value={tempEntry.descriptionData}
        />
      ) : null}
    </TabsContent>
  );
}
