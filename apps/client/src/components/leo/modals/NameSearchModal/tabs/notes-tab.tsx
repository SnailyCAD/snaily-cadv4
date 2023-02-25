import * as React from "react";
import type { Note } from "@snailycad/types";
import { Button, TabsContent } from "@snailycad/ui";
import { FullDate } from "components/shared/FullDate";
import { Table, useTableState } from "components/shared/Table";
import { useTranslations } from "next-intl";
import { useModal } from "state/modalState";
import type { NameSearchResult } from "state/search/name-search-state";
import type { VehicleSearchResult } from "state/search/vehicle-search-state";
import { ModalIds } from "types/ModalIds";
import { ManageNoteModal } from "../ManageNoteModal";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import type { DeleteNotesData } from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";

interface Props<T extends VehicleSearchResult | NameSearchResult> {
  currentResult: VehicleSearchResult | NameSearchResult;
  setCurrentResult(value: T | null | undefined): void;
  type: "CITIZEN" | "VEHICLE";
}

export function NotesTab<T extends VehicleSearchResult | NameSearchResult>({
  currentResult,
  setCurrentResult,
  type,
}: Props<T>) {
  const [open, setOpen] = React.useState(false);
  const t = useTranslations();
  const { openModal, closeModal } = useModal();
  const { state, execute } = useFetch();

  const tableState = useTableState();
  const notes = getNotesFromCurrentResult(currentResult);
  const [tempNote, noteState] = useTemporaryItem(notes);

  async function handleDelete() {
    if (!currentResult || !tempNote) return;

    const { json } = await execute<DeleteNotesData>({
      path: `/notes/${tempNote.id}`,
      method: "DELETE",
      data: { type, itemId: currentResult.id, text: tempNote.text },
    });

    if (typeof json === "boolean") {
      setCurrentResult({
        ...currentResult,
        notes: notes?.filter((v) => v.id !== tempNote.id),
      } as T);
      noteState.setTempId(null);
      closeModal(ModalIds.AlertDeleteNote);
    }
  }

  function handleEditClick(note: Note) {
    noteState.setTempId(note.id);
    openModal(ModalIds.ManageNote);
    setOpen(true);
  }

  function handleDeleteClick(note: Note) {
    noteState.setTempId(note.id);
    openModal(ModalIds.AlertDeleteNote);
    setOpen(true);
  }

  function handleAddClick() {
    setOpen(true);
    openModal(ModalIds.ManageNote);
  }

  const isConfidential = "isConfidential" in currentResult && currentResult.isConfidential;
  if (!currentResult || isConfidential) {
    return null;
  }

  return (
    <TabsContent value="notes">
      <header className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">{t("Leo.notes")}</h3>

        <div>
          <Button type="button" onPress={handleAddClick}>
            {t("Leo.addNote")}
          </Button>
        </div>
      </header>

      {notes.length <= 0 ? (
        <p className="text-neutral-700 dark:text-gray-400 my-2">{t("Leo.noNotes")}</p>
      ) : (
        <Table
          tableState={tableState}
          features={{ isWithinCardOrModal: true }}
          data={notes.map((note) => ({
            id: note.id,
            text: note.text,
            createdAt: <FullDate>{note.createdAt}</FullDate>,
            actions: (
              <>
                <Button
                  type="button"
                  variant="success"
                  size="xs"
                  onPress={() => handleEditClick(note)}
                >
                  {t("Common.edit")}
                </Button>

                <Button
                  type="button"
                  variant="danger"
                  className="ml-2"
                  size="xs"
                  onPress={() => handleDeleteClick(note)}
                >
                  {t("Common.delete")}
                </Button>
              </>
            ),
          }))}
          columns={[
            { header: t("Leo.text"), accessorKey: "text" },
            { header: t("Common.createdAt"), accessorKey: "createdAt" },
            { header: t("Common.actions"), accessorKey: "actions" },
          ]}
        />
      )}

      {open ? (
        <>
          <ManageNoteModal
            currentResult={currentResult}
            type={type}
            onClose={() => {
              noteState.setTempId(null);
              setOpen(false);
            }}
            onCreate={(note) => {
              if (!currentResult) return;

              setCurrentResult({
                ...currentResult,
                notes: [...(notes ?? []), note],
              } as T);
            }}
            onUpdate={(note) => {
              const copiedNotes = [...notes];
              const idx = copiedNotes.findIndex((v) => v.id === note.id);
              copiedNotes[idx] = note;

              setCurrentResult({ ...currentResult, notes: copiedNotes } as T);
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

function getNotesFromCurrentResult<T extends VehicleSearchResult | NameSearchResult>(
  currentResult: Props<T>["currentResult"],
) {
  if (isNameSearchResult(currentResult)) {
    if (currentResult.isConfidential) return [];
    return currentResult.notes ?? [];
  }

  return currentResult.notes ?? [];
}

function isNameSearchResult(
  currentResult: NameSearchResult | VehicleSearchResult,
): currentResult is NameSearchResult {
  return (
    "isConfidential" in currentResult &&
    "socialSecurityNumber" in currentResult &&
    "name" in currentResult
  );
}
