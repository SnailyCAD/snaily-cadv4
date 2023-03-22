import { useTranslations } from "use-intl";
import { Button } from "@snailycad/ui";
import type { MedicalRecord, Value } from "@snailycad/types";
import { ModalIds } from "types/ModalIds";
import { useModal } from "state/modalState";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { Table, useTableState } from "components/shared/Table";
import { useCitizen } from "context/CitizenContext";
import type { DeleteCitizenMedicalRecordsData } from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { FullDate } from "components/shared/FullDate";
import dynamic from "next/dynamic";

const ManageMedicalRecordsModal = dynamic(
  async () => (await import("./manage-medical-records-modal")).ManageMedicalRecordsModal,
);

export function MedicalRecords() {
  const { state, execute } = useFetch();
  const { openModal, closeModal } = useModal();
  const t = useTranslations("MedicalRecords");
  const common = useTranslations("Common");
  const { citizen, setCurrentCitizen } = useCitizen(false);
  const tableState = useTableState();

  const [tempRecord, recordState] = useTemporaryItem(citizen.medicalRecords);

  async function handleDelete() {
    if (!tempRecord) return;

    const { json } = await execute<DeleteCitizenMedicalRecordsData>({
      path: `/medical-records/${tempRecord.id}`,
      method: "DELETE",
    });

    if (json) {
      setCurrentCitizen({
        ...citizen,
        medicalRecords: citizen.medicalRecords.filter((v) => v.id !== tempRecord.id),
      });
      closeModal(ModalIds.AlertDeleteMedicalRecord);
      recordState.setTempId(null);
    }
  }

  function handleBloodgroupStateChange(prevState: MedicalRecord[], bloodGroup: Value | null) {
    return prevState.map((med) => ({ ...med, bloodGroup, bloodGroupId: bloodGroup?.id ?? null }));
  }

  function handleDeleteClick(record: MedicalRecord) {
    recordState.setTempId(record.id);
    openModal(ModalIds.AlertDeleteMedicalRecord);
  }

  function handleEditClick(record: MedicalRecord) {
    recordState.setTempId(record.id);
    openModal(ModalIds.ManageMedicalRecords);
  }

  return (
    <>
      <div className="p-4 card">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{t("yourMedicalRecords")}</h1>

          <Button onPress={() => openModal(ModalIds.ManageMedicalRecords)} size="xs">
            {t("addMedicalRecord")}
          </Button>
        </header>

        {citizen.medicalRecords.length <= 0 ? (
          <p className="text-neutral-700 dark:text-gray-400">{t("noMedicalRecords")}</p>
        ) : (
          <Table
            tableState={tableState}
            features={{ isWithinCardOrModal: true }}
            data={citizen.medicalRecords.map((record) => ({
              id: record.id,
              diseases: record.type,
              bloodGroup: record.bloodGroup?.value ?? common("none"),
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
      </div>

      <ManageMedicalRecordsModal
        onCreate={(record) => {
          setCurrentCitizen({
            ...citizen,
            medicalRecords: [
              ...handleBloodgroupStateChange(citizen.medicalRecords, record.bloodGroup),
              record,
            ],
          });

          closeModal(ModalIds.ManageMedicalRecords);
        }}
        onUpdate={(old, newR) => {
          const copy = [...citizen.medicalRecords];
          const idx = copy.indexOf(old);
          copy[idx] = newR;

          setCurrentCitizen({
            ...citizen,
            medicalRecords: handleBloodgroupStateChange(copy, newR.bloodGroup),
          });
          closeModal(ModalIds.ManageMedicalRecords);
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
    </>
  );
}
