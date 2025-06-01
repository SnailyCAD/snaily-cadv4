import { Button, FullDate } from "@snailycad/ui";
import { Table, useTableState } from "components/shared/Table";
import { usePetsState } from "state/citizen/pets-state";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";
import { ManagePetMedicalRecordModal } from "./manage-pet-medical-record-modal";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import type { PetMedicalRecord } from "@snailycad/types";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";

export function PetMedicalRecordsCard() {
  const { currentPet, setCurrentPet } = usePetsState();
  const t = useTranslations("MedicalRecords");
  const common = useTranslations("Common");
  const modalState = useModal();
  const tableState = useTableState();
  const { state, execute } = useFetch();

  const medicalRecords = currentPet?.medicalRecords ?? [];
  const [tempRecord, recordState] = useTemporaryItem(medicalRecords);

  function handleEditClick(medicalRecord: PetMedicalRecord) {
    recordState.setTempId(medicalRecord.id);
    modalState.openModal(ModalIds.ManagePetMedicalRecord);
  }

  function handleDeleteClick(medicalRecord: PetMedicalRecord) {
    recordState.setTempId(medicalRecord.id);
    modalState.openModal(ModalIds.AlertDeleteMedicalRecord);
  }

  async function handleDelete() {
    if (!currentPet) return;

    const { json } = await execute({
      path: `/pets/${currentPet.id}/medical-records/${recordState.tempId}`,
      method: "DELETE",
    });

    if (typeof json === "boolean" && json) {
      setCurrentPet({
        ...currentPet,
        medicalRecords: medicalRecords.filter((v) => v.id !== recordState.tempId),
      });
      modalState.closeModal(ModalIds.AlertDeleteMedicalRecord);
    }
  }

  if (!currentPet) {
    return null;
  }

  return (
    <div className="p-4 card mt-5">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("petMedicalRecords")}</h1>

        <Button onPress={() => modalState.openModal(ModalIds.ManagePetMedicalRecord)} size="xs">
          {t("addMedicalRecord")}
        </Button>
      </header>

      {medicalRecords.length <= 0 ? (
        <p className="text-neutral-700 dark:text-gray-400 my-2">{t("petNoMedicalRecords")}</p>
      ) : (
        <Table
          tableState={tableState}
          features={{ isWithinCardOrModal: true }}
          data={medicalRecords.map((record) => ({
            id: record.id,
            diseases: record.type,
            description: record.description || common("none"),
            createdAt: <FullDate>{record.createdAt}</FullDate>,
            actions: (
              <>
                <Button onPress={() => handleEditClick(record)} size="xs" variant="success">
                  {common("edit")}
                </Button>
                <Button
                  className="ml-2"
                  onPress={() => handleDeleteClick(record)}
                  size="xs"
                  variant="danger"
                >
                  {common("delete")}
                </Button>
              </>
            ),
          }))}
          columns={[
            { header: t("diseases"), accessorKey: "diseases" },
            { header: t("bloodGroup"), accessorKey: "bloodGroup" },
            { header: common("description"), accessorKey: "description" },
            { header: common("createdAt"), accessorKey: "createdAt" },
            { header: common("actions"), accessorKey: "actions" },
          ]}
        />
      )}

      <ManagePetMedicalRecordModal
        onCreate={(record) => {
          if (!currentPet) return;

          setCurrentPet({
            ...currentPet,
            medicalRecords: [...medicalRecords, record],
          });

          modalState.closeModal(ModalIds.ManagePetMedicalRecord);
        }}
        onUpdate={(record) => {
          if (!currentPet) return;

          setCurrentPet({
            ...currentPet,
            medicalRecords: currentPet.medicalRecords?.map((v) =>
              v.id === record.id ? record : v,
            ),
          });

          modalState.closeModal(ModalIds.ManagePetMedicalRecord);
        }}
        medicalRecord={tempRecord}
        onClose={() => recordState.setTempId(null)}
      />

      <AlertModal
        onDeleteClick={handleDelete}
        description={t("alert_deleteMedicalRecord")}
        id={ModalIds.AlertDeleteMedicalRecord}
        title={t("deleteMedicalRecord")}
        state={state}
        onClose={() => recordState.setTempId(null)}
      />
    </div>
  );
}
