import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import type { MedicalRecord } from "@snailycad/types";
import { ModalIds } from "types/ModalIds";
import { useModal } from "context/ModalContext";
import { ManageMedicalRecordsModal } from "./ManageMedicalRecordsModal";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { Table } from "components/shared/Table";

export function MedicalRecords(props: { medicalRecords: MedicalRecord[] }) {
  const { state, execute } = useFetch();
  const { openModal, closeModal } = useModal();
  const t = useTranslations("MedicalRecords");
  const common = useTranslations("Common");

  const [medicalRecords, setMedicalRecords] = React.useState<MedicalRecord[]>(props.medicalRecords);
  const [tempRecord, setTempRecord] = React.useState<MedicalRecord | null>(null);

  async function handleDelete() {
    if (!tempRecord) return;

    const { json } = await execute(`/medical-records/${tempRecord.id}`, {
      method: "DELETE",
    });

    if (json) {
      setMedicalRecords((p) => p.filter((v) => v.id !== tempRecord.id));
      closeModal(ModalIds.AlertDeleteMedicalRecord);
      setTempRecord(null);
    }
  }

  function handleDeleteClick(record: MedicalRecord) {
    setTempRecord(record);
    openModal(ModalIds.AlertDeleteMedicalRecord);
  }

  function handleEditClick(record: MedicalRecord) {
    setTempRecord(record);
    openModal(ModalIds.ManageMedicalRecords);
  }

  return (
    <>
      <div className="p-4 card">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{t("yourMedicalRecords")}</h1>

          <Button onClick={() => openModal(ModalIds.ManageMedicalRecords)} small>
            {t("addMedicalRecord")}
          </Button>
        </header>

        {medicalRecords.length <= 0 ? (
          <p className="text-gray-600 dark:text-gray-400">{t("noMedicalRecords")}</p>
        ) : (
          <Table
            isWithinCard
            data={medicalRecords.map((record) => ({
              diseases: record.type,
              bloodGroup: record.bloodGroup?.value ?? common("none"),
              description: record.description,
              actions: (
                <>
                  <Button onClick={() => handleEditClick(record)} small variant="success">
                    {common("edit")}
                  </Button>
                  <Button
                    className="ml-2"
                    onClick={() => handleDeleteClick(record)}
                    small
                    variant="danger"
                  >
                    {common("delete")}
                  </Button>
                </>
              ),
            }))}
            columns={[
              { Header: t("diseases"), accessor: "diseases" },
              { Header: t("bloodGroup"), accessor: "bloodGroup" },
              { Header: common("description"), accessor: "description" },
              { Header: common("actions"), accessor: "actions" },
            ]}
          />
        )}
      </div>

      <ManageMedicalRecordsModal
        onCreate={(record) => {
          setMedicalRecords((p) => [...p, record]);
          closeModal(ModalIds.ManageMedicalRecords);
        }}
        onUpdate={(old, newR) => {
          setMedicalRecords((p) => {
            const idx = p.indexOf(old);
            p[idx] = newR;
            return p;
          });
          closeModal(ModalIds.ManageMedicalRecords);
        }}
        medicalRecord={tempRecord}
        onClose={() => setTempRecord(null)}
      />

      <AlertModal
        onDeleteClick={handleDelete}
        description={t("alert_deleteMedicalRecord")}
        id={ModalIds.AlertDeleteMedicalRecord}
        title={t("deleteMedicalRecord")}
        state={state}
        onClose={() => setTempRecord(null)}
      />
    </>
  );
}
