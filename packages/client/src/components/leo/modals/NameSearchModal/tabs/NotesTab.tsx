import * as React from "react";
import type { Note } from "@snailycad/types";
import { Button } from "components/Button";
import { FullDate } from "components/shared/FullDate";
import { Table } from "components/shared/Table";
import { TabsContent } from "components/shared/TabList";
import { useTranslations } from "next-intl";
import { useModal } from "state/modalState";
import { useNameSearch } from "state/search/nameSearchState";
import { ModalIds } from "types/ModalIds";
import { ManageNoteModal } from "../ManageNoteModal";

export function NameSearchNotesTabs() {
  const [tempNote, setTempNote] = React.useState<Note | null>(null);
  const t = useTranslations();
  const { currentResult, setCurrentResult } = useNameSearch();
  const { openModal } = useModal();

  function handleEditClick(note: Note) {
    setTempNote(note);
    openModal(ModalIds.ManageNote);
  }

  function handleDeleteClick(note: Note) {
    setTempNote(note);
    openModal(ModalIds.AlertDeleteNote);
  }

  if (!currentResult || !Array.isArray(currentResult.notes)) {
    return null;
  }

  return (
    <TabsContent value="notes">
      <header className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">{t("Leo.notes")}</h3>

        <div>
          <Button type="button" onClick={() => openModal(ModalIds.ManageNote)}>
            {t("Leo.addNote")}
          </Button>
        </div>
      </header>

      {currentResult.notes.length <= 0 ? (
        <p className="text-neutral-700 dark:text-gray-400 my-2">{t("Leo.noNotes")}</p>
      ) : (
        <Table
          data={currentResult.notes.map((note) => ({
            text: note.text,
            // createdBy: String(note.createdBy),
            createdAt: <FullDate>{note.createdAt}</FullDate>,
            actions: (
              <>
                <Button type="button" variant="success" small onClick={() => handleEditClick(note)}>
                  {t("Common.edit")}
                </Button>

                <Button
                  type="button"
                  variant="danger"
                  className="ml-2"
                  small
                  onClick={() => handleDeleteClick(note)}
                >
                  {t("Common.delete")}
                </Button>
              </>
            ),
          }))}
          columns={[
            { Header: t("Leo.text"), accessor: "text" },
            // { Header: t("Common.createdBy"), accessor: "createdBy" },
            { Header: t("Common.createdAt"), accessor: "createdAt" },
            { Header: t("Common.actions"), accessor: "actions" },
          ]}
        />
      )}

      <ManageNoteModal
        onClose={() => setTempNote(null)}
        onCreate={(note) => {
          if (!currentResult) return;

          setCurrentResult({
            ...currentResult,
            notes: [...(currentResult.notes ?? []), note],
          });
        }}
        note={tempNote}
      />
    </TabsContent>
  );
}
