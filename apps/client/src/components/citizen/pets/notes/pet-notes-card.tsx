import type { Note } from "@snailycad/types";
import { Button, FullDate } from "@snailycad/ui";
import { Table, useTableState } from "components/shared/Table";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { usePetsState } from "state/citizen/pets-state";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";
import { ManagePetNoteModal } from "./manage-pet-note-modal";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";

export function PetNotesCard() {
  const { currentPet, setCurrentPet } = usePetsState();
  const t = useTranslations();
  const modalState = useModal();
  const { execute, state } = useFetch();

  const notes = currentPet?.notes ?? [];
  const [tempNote, noteState] = useTemporaryItem(notes);
  const tableState = useTableState();

  async function handleDelete() {
    if (!currentPet) return;

    const { json } = await execute({
      path: `/pets/${currentPet.id}/notes/${noteState.tempId}`,
      method: "DELETE",
    });

    if (typeof json === "boolean" && json) {
      setCurrentPet({
        ...currentPet,
        notes: notes.filter((v) => v.id !== noteState.tempId),
      });
      modalState.closeModal(ModalIds.AlertDeleteNote);
    }
  }

  function handleEditClick(note: Note) {
    noteState.setTempId(note.id);
    modalState.openModal(ModalIds.ManageNote);
  }

  function handleDeleteClick(note: Note) {
    noteState.setTempId(note.id);
    modalState.openModal(ModalIds.AlertDeleteNote);
  }

  if (!currentPet) {
    return null;
  }

  return (
    <div className="p-4 card mt-5">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("Pets.notes")}</h1>

        <Button onPress={() => modalState.openModal(ModalIds.ManageNote)} size="xs">
          {t("Pets.addNote")}
        </Button>
      </header>

      {notes.length <= 0 ? (
        <p className="text-neutral-700 dark:text-gray-400 my-2">{t("Pets.noNotes")}</p>
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
            { header: t("Common.description"), accessorKey: "text" },
            { header: t("Common.createdAt"), accessorKey: "createdAt" },
            { header: t("Common.actions"), accessorKey: "actions" },
          ]}
        />
      )}

      <ManagePetNoteModal
        onClose={() => {
          noteState.setTempId(null);
          modalState.closeModal(ModalIds.ManageNote);
        }}
        onCreate={(note) => {
          if (!currentPet) return;

          setCurrentPet({
            ...currentPet,
            notes: [...notes, note],
          });
        }}
        onUpdate={(note) => {
          if (!currentPet) return;

          setCurrentPet({
            ...currentPet,
            notes: notes.map((n) => (n.id === note.id ? note : n)),
          });
        }}
        note={tempNote}
      />

      <AlertModal
        title={t("Pets.deleteNote")}
        description={t("Pets.alert_deleteNote")}
        id={ModalIds.AlertDeleteNote}
        onDeleteClick={handleDelete}
        state={state}
        onClose={() => noteState.setTempId(null)}
      />
    </div>
  );
}
