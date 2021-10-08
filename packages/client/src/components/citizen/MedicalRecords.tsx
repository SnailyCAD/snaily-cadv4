import * as React from "react";
import { Button } from "components/Button";
import { MedicalRecord } from "types/prisma";
import { ModalIds } from "types/ModalIds";
import { useModal } from "context/ModalContext";
import { useTranslations } from "use-intl";

export const MedicalRecords = (props: { medicalRecords: MedicalRecord[] }) => {
  const { openModal } = useModal();
  const t = useTranslations("MedicalRecords");
  const common = useTranslations("Common");

  const [medicalRecords, setMedicalRecords] = React.useState<MedicalRecord[]>(props.medicalRecords);
//   const [tempRecord, setTempRecord] = React.useState<MedicalRecord | null>(null);

  return (
    <>
      <div className="bg-gray-200/60 p-4 rounded-md">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{t("yourMedicalRecords")}</h1>

          <Button onClick={() => openModal(ModalIds.ManageMedicalRecords)} small>
            {t("addMedicalRecord")}
          </Button>
        </header>

        {medicalRecords.length <= 0 ? (
          <p className="text-gray-600">{t("noMedicalRecords")}</p>
        ) : (
          <table className="table max-h-64 mt-5">
            <thead>
              <tr>
                <th>{common("type")}</th>
                <th>{common("description")}</th>
                <th>{common("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {medicalRecords.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td>{vehicle.type}</td>
                  <td>{vehicle.description}</td>
                  <td>
                    <Button small variant="danger">
                      {common("delete")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};
