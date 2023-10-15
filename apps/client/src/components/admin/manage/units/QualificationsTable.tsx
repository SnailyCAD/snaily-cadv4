import * as React from "react";
import { QualificationValueType, type UnitQualification } from "@snailycad/types";
import { Button, FullDate } from "@snailycad/ui";
import { AlertModal } from "components/modal/AlertModal";
import { Table, useTableState } from "components/shared/Table";
import useFetch from "lib/useFetch";
import { useTranslations } from "next-intl";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { AddQualificationsModal } from "./AddQualificationsModal";
import { QualificationsHoverCard } from "./QualificationHoverCard";
import type {
  DeleteManageUnitQualificationData,
  GetManageUnitByIdData,
  PutManageUnitQualificationData,
} from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";

interface Props {
  hasManagePermissions: boolean;
  unit: GetManageUnitByIdData;
  setUnit: React.Dispatch<React.SetStateAction<GetManageUnitByIdData>>;
  areFormFieldsDisabled: boolean;
}

export function QualificationsTable({
  hasManagePermissions,
  areFormFieldsDisabled,
  setUnit,
  unit,
}: Props) {
  const t = useTranslations("Leo");
  const modalState = useModal();

  const awards =
    unit.qualifications?.filter(
      (v) => v.qualification.qualificationType === QualificationValueType.AWARD,
    ) ?? [];

  const qualifications =
    unit.qualifications?.filter(
      (v) => v.qualification.qualificationType === QualificationValueType.QUALIFICATION,
    ) ?? [];

  return (
    <div className={hasManagePermissions ? "mt-10" : undefined}>
      <div id="qualifications">
        <header className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t("unitQualifications")}</h2>

          <div>
            <Button
              onPress={() =>
                modalState.openModal(
                  ModalIds.ManageUnitQualifications,
                  QualificationValueType.QUALIFICATION,
                )
              }
            >
              {t("addQualification")}
            </Button>
          </div>
        </header>

        {!qualifications.length ? (
          <p className="my-2 text-neutral-700 dark:text-gray-400">{t("noQualifications")}</p>
        ) : (
          <QualificationAwardsTable
            areFormFieldsDisabled={areFormFieldsDisabled}
            setUnit={setUnit}
            unit={{ ...unit, qualifications }}
          />
        )}
      </div>

      <div id="awards">
        <header className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t("unitAwards")}</h2>
          <div>
            <Button
              isDisabled={areFormFieldsDisabled}
              onPress={() =>
                modalState.openModal(
                  ModalIds.ManageUnitQualifications,
                  QualificationValueType.AWARD,
                )
              }
            >
              {t("addAward")}
            </Button>
          </div>
        </header>

        {!awards.length ? (
          <p className="my-2 text-neutral-700 dark:text-gray-400">{t("noAwards")}</p>
        ) : (
          <QualificationAwardsTable
            areFormFieldsDisabled={areFormFieldsDisabled}
            setUnit={setUnit}
            unit={{ ...unit, qualifications: awards }}
          />
        )}
      </div>

      {areFormFieldsDisabled ? null : <AddQualificationsModal setUnit={setUnit} unit={unit} />}
    </div>
  );
}

function QualificationAwardsTable({
  unit,
  areFormFieldsDisabled,
  setUnit,
}: Omit<Props, "hasManagePermissions">) {
  const [tempQualification, qualificationState] = useTemporaryItem(unit.qualifications);

  const tableState = useTableState();
  const t = useTranslations("Leo");
  const common = useTranslations("Common");
  const modalState = useModal();
  const { state, execute } = useFetch();

  function handleDeleteClick(qualification: UnitQualification) {
    qualificationState.setTempId(qualification.id);
    modalState.openModal(ModalIds.AlertDeleteUnitQualification);
  }

  async function handleSuspendOrUnsuspend(
    type: "suspend" | "unsuspend",
    qualification: UnitQualification,
  ) {
    if (areFormFieldsDisabled) return;

    const { json } = await execute<PutManageUnitQualificationData>({
      path: `/admin/manage/units/${unit.id}/qualifications/${qualification.id}`,
      method: "PUT",
      data: { type },
    });

    if (json) {
      setUnit((p: Props["unit"]) => ({
        ...p,
        qualifications: p.qualifications.map((q) => {
          if (q.id === qualification.id) {
            return { ...qualification, ...json };
          }

          return q;
        }),
      }));
    }
  }

  async function handleDelete() {
    if (!tempQualification || areFormFieldsDisabled) return;

    const { json } = await execute<DeleteManageUnitQualificationData>({
      path: `/admin/manage/units/${unit.id}/qualifications/${tempQualification.id}`,
      method: "DELETE",
    });

    if (json) {
      setUnit((p: Props["unit"]) => ({
        ...p,
        qualifications: p.qualifications.filter((v) => v.id !== tempQualification.id),
      }));
      qualificationState.setTempId(null);
      modalState.closeModal(ModalIds.AlertDeleteUnitQualification);
    }
  }

  return (
    <div>
      <Table
        tableState={tableState}
        data={unit.qualifications.map((qa) => {
          return {
            id: qa.id,
            image: <QualificationsHoverCard qualification={qa} />,
            name: qa.qualification.value.value,
            assignedAt: <FullDate>{qa.createdAt}</FullDate>,
            actions: (
              <>
                {qa.suspendedAt ? (
                  <Button
                    onPress={() => handleSuspendOrUnsuspend("unsuspend", qa)}
                    isDisabled={areFormFieldsDisabled || state === "loading"}
                    size="xs"
                    variant="success"
                  >
                    {t("unsuspend")}
                  </Button>
                ) : (
                  <Button
                    isDisabled={areFormFieldsDisabled || state === "loading"}
                    onPress={() => handleSuspendOrUnsuspend("suspend", qa)}
                    size="xs"
                    variant="amber"
                  >
                    {t("suspend")}
                  </Button>
                )}
                <Button
                  isDisabled={areFormFieldsDisabled || state === "loading"}
                  onPress={() => handleDeleteClick(qa)}
                  className="ml-2"
                  size="xs"
                  variant="danger"
                >
                  {common("delete")}
                </Button>
              </>
            ),
          };
        })}
        columns={[
          { header: common("image"), accessorKey: "image" },
          { header: common("name"), accessorKey: "name" },
          { header: t("assignedAt"), accessorKey: "assignedAt" },
          { header: common("actions"), accessorKey: "actions" },
        ]}
      />
      {areFormFieldsDisabled ? null : (
        <AlertModal
          title={t("deleteQualification")}
          description={t("alert_deleteQualification")}
          id={ModalIds.AlertDeleteUnitQualification}
          onDeleteClick={handleDelete}
          state={state}
        />
      )}
    </div>
  );
}
