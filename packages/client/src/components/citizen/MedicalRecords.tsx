import * as React from "react";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { MedicalRecord } from "types/prisma";
import { ModalIds } from "types/ModalIds";
import { useModal } from "context/ModalContext";
import { ManageMedicalRecordsModal } from "./modals/ManageMedicalRecordsModal";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";

export const MedicalRecords = (props: { medicalRecords: MedicalRecord[] }) => {
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
          <div className="w-full mt-3 overflow-x-auto">
            <table className="w-full max-w-4xl overflow-hidden whitespace-nowrap max-h-64">
              <thead>
                <tr>
                  <th>{t("diseases")}</th>
                  <th>{t("bloodGroup")}</th>
                  <th>{common("description")}</th>
                  <th>{common("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {medicalRecords.map((record) => (
                  <tr key={record.id}>
                    <td>{record.type}</td>
                    <td>{record.bloodGroup?.value ?? common("none")}</td>
                    <td>{record.description}</td>
                    <td className="w-[30%]">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
};
