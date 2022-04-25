import * as React from "react";
import type { EmsFdDeputy, Officer, UnitQualification } from "@snailycad/types";
import { Button } from "components/Button";
import { AlertModal } from "components/modal/AlertModal";
import { Table } from "components/shared/Table";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { AddQualificationsModal } from "./AddQualificationsModal";

interface Props {
  unit: (EmsFdDeputy | Officer) & { qualifications: UnitQualification[] };
  setUnit: React.Dispatch<React.SetStateAction<any>>;
}

export function QualificationsTable({ setUnit, unit }: Props) {
  const [tempQualification, setTempQualification] = React.useState<UnitQualification | null>(null);

  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const { openModal, closeModal } = useModal();
  const { state, execute } = useFetch();

  function handleDeleteClick(qualification: UnitQualification) {
    setTempQualification(qualification);
    openModal(ModalIds.AlertDeleteUnitQualification);
  }

  async function handleDelete() {
    if (!tempQualification) return;

    const { json } = await execute(
      `/admin/manage/units/${unit.id}/qualifications/${tempQualification.id}`,
      { method: "DELETE" },
    );

    if (json) {
      setUnit((p: Props["unit"]) => ({
        ...p,
        qualifications: p.qualifications.filter((v) => v.id !== tempQualification.id),
      }));
      setTempQualification(null);
      closeModal(ModalIds.AlertDeleteUnitQualification);
    }
  }

  return (
    <div className="mt-3">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t("unitQualifications")}</h1>

        <div>
          <Button onClick={() => openModal(ModalIds.ManageUnitQualifications)}>
            {t("addQualification")}
          </Button>
        </div>
      </header>

      {unit.qualifications.length <= 0 ? (
        <p className="my-2 text-gray-400">{t("noQualifications")}</p>
      ) : (
        <Table
          data={unit.qualifications.map((qa) => {
            return {
              name: qa.qualification.value.value,
              actions: (
                <>
                  {qa.suspendedAt ? (
                    <Button small variant="success">
                      {t("unsuspend")}
                    </Button>
                  ) : (
                    <Button small variant="danger">
                      {t("suspend")}
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDeleteClick(qa)}
                    className="ml-2"
                    small
                    variant="danger"
                  >
                    {common("delete")}
                  </Button>
                </>
              ),
            };
          })}
          columns={[
            { Header: common("name"), accessor: "name" },
            { Header: common("actions"), accessor: "actions" },
          ]}
        />
      )}

      <AddQualificationsModal setUnit={setUnit} unit={unit} />
      <AlertModal
        title={t("deleteQualification")}
        description={t("alert_deleteQualification")}
        id={ModalIds.AlertDeleteUnitQualification}
        onDeleteClick={handleDelete}
        state={state}
      />
    </div>
  );
}
