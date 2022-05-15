import * as React from "react";
import type { Note } from "@snailycad/types";
import { Button } from "components/Button";
import { FullDate } from "components/shared/FullDate";
import { Table } from "components/shared/Table";
import { TabsContent } from "components/shared/TabList";
import { useTranslations } from "next-intl";
import { useModal } from "state/modalState";
import type { NameSearchResult } from "state/search/nameSearchState";
import type { VehicleSearchResult } from "state/search/vehicleSearchState";
import { ModalIds } from "types/ModalIds";
import { ManageNoteModal } from "../ManageNoteModal";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";

interface Props {
  currentResult: VehicleSearchResult | NameSearchResult;
  setCurrentResult: any;
  type: "CITIZEN" | "VEHICLE";
}

export function NotesTab({ currentResult, setCurrentResult, type }: Props) {
  const [open, setOpen] = React.useState(false);
  const [tempNote, setTempNote] = React.useState<Note | null>(null);
  const t = useTranslations();
  const { openModal, closeModal } = useModal();
  const { state, execute } = useFetch();

  async function handleDelete() {
    if (!currentResult || !tempNote) return;

    const { json } = await execute(`/notes/${tempNote.id}`, {
      method: "DELETE",
      data: { type, itemId: currentResult.id, text: tempNote.text },
    });

    if (typeof json === "boolean") {
      setCurrentResult({
        ...currentResult,
        notes: currentResult.notes?.filter((v) => v.id !== tempNote.id),
      });
      setTempNote(null);
      closeModal(ModalIds.AlertDeleteNote);
    }
  }

  function handleEditClick(note: Note) {
    setTempNote(note);
    openModal(ModalIds.ManageNote);
    setOpen(true);
  }

  function handleDeleteClick(note: Note) {
    setTempNote(note);
    openModal(ModalIds.AlertDeleteNote);
    setOpen(true);
  }

  function handleAddClick() {
    setOpen(true);
    openModal(ModalIds.ManageNote);
  }

  if (!currentResult || !Array.isArray(currentResult.notes)) {
    return null;
  }

  return (
    <TabsContent value="notes">
      <header className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">{t("Leo.notes")}</h3>

        <div>
          <Button type="button" onClick={handleAddClick}>
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
            { Header: t("Common.createdAt"), accessor: "createdAt" },
            { Header: t("Common.actions"), accessor: "actions" },
          ]}
        />
      )}

      {open ? (
        <>
          <ManageNoteModal
            currentResult={currentResult}
            type={type}
            onClose={() => {
              setTempNote(null);
              setOpen(false);
            }}
            onCreate={(note) => {
              if (!currentResult) return;

              setCurrentResult({
                ...currentResult,
                notes: [...(currentResult.notes ?? []), note],
              });
            }}
            onUpdate={(note) => {
              if (!currentResult.notes) return;
              const notes = [...currentResult.notes];
              const idx = notes.findIndex((v) => v.id === note.id);

              notes[idx] = note;

              setCurrentResult({ ...currentResult, notes });
            }}
            note={tempNote}
          />

          <AlertModal
            title={t("Leo.deleteNote")}
            description={t("Leo.alert_deleteNote")}
            id={ModalIds.AlertDeleteNote}
            onDeleteClick={handleDelete}
            state={state}
          />
        </>
      ) : null}
    </TabsContent>
  );
}
