import * as React from "react";
import { Record, RecordType, ValueType } from "@snailycad/types";
import { ManageRecordModal } from "components/leo/modals/manage-record/manage-record-modal";
import { useLoadValuesClientSide } from "hooks/useLoadValuesClientSide";
import { useTranslations } from "use-intl";
import { Button } from "@snailycad/ui";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { useFormikContext } from "formik";
import { RecordsTable } from "components/leo/modals/NameSearchModal/tabs/records-tab";
import { v4 } from "uuid";

let valuesFetched = false;

export function CreatePreviousRecordsStep() {
  const t = useTranslations();
  const [type, setType] = React.useState<RecordType | null>(null);
  const [selectedRecord, setSelectedRecord] = React.useState<Record | null>(null);

  const { isOpen, openModal } = useModal();
  const { values, setFieldValue } = useFormikContext<any>();

  useLoadValuesClientSide({
    valueTypes: [ValueType.PENAL_CODE],
    enabled: !valuesFetched,
  });

  React.useEffect(() => {
    valuesFetched = true;
  }, []);

  function handleOpen(type: RecordType) {
    const id =
      type === RecordType.WRITTEN_WARNING
        ? ModalIds.CreateWrittenWarning
        : type === RecordType.ARREST_REPORT
        ? ModalIds.CreateArrestReport
        : ModalIds.CreateTicket;

    setType(type);

    const fullName = `${values?.name} ${values?.surname}`;
    openModal(id, { citizenName: fullName, citizenId: fullName });
  }

  function handleAdd(data: any) {
    const prevRecords = values?.records ?? [];

    setFieldValue("records", [...prevRecords, { ...data, id: v4() }]);
    return true;
  }

  function handleDeleteClick(record: any) {
    const prevRecords = values?.records ?? [];

    setFieldValue(
      "records",
      prevRecords.filter((v: Record) => v.id !== record.id),
    );
  }

  function handleEditClick(record: any) {
    const fullName = `${values?.name} ${values?.surname}`;
    setSelectedRecord(record);

    openModal(ModalIds.ManageRecord, {
      ...record,
      citizenId: fullName,
      citizenName: fullName,
    });
  }

  function handleEdit(record: any) {
    const prevRecords = values?.records ?? [];
    setFieldValue(
      "records",
      prevRecords.map((v: any) => {
        if (v.id === record.id) return record;
        return v;
      }),
    );

    return true;
  }

  return (
    <div className="mb-5">
      <p>{t("Citizen.createPreviousRecordsStepDescription")}</p>

      <div className="flex gap-2 my-3">
        <Button onPress={() => handleOpen(RecordType.TICKET)}>{t("Leo.createTicket")}</Button>
        <Button onPress={() => handleOpen(RecordType.WRITTEN_WARNING)}>
          {t("Leo.createWrittenWarning")}
        </Button>
        <Button onPress={() => handleOpen(RecordType.ARREST_REPORT)}>
          {t("Leo.createArrestReport")}
        </Button>
      </div>

      {values.records.length <= 0 ? (
        <p>No records selected yet</p>
      ) : (
        <RecordsTable
          onDelete={handleDeleteClick}
          onEdit={handleEditClick}
          hasDeletePermissions
          data={values.records}
        />
      )}

      {type && !selectedRecord ? (
        <ManageRecordModal
          onClose={() => {
            setType(null);
            setSelectedRecord(null);
          }}
          customSubmitHandler={handleAdd}
          hideCitizenField
          type={type}
        />
      ) : null}

      {selectedRecord && isOpen(ModalIds.ManageRecord) ? (
        <ManageRecordModal
          customSubmitHandler={handleEdit}
          hideCitizenField
          id={ModalIds.ManageRecord}
          type={selectedRecord.type}
          record={selectedRecord}
          onClose={() => {
            setType(null);
            setSelectedRecord(null);
          }}
        />
      ) : null}
    </div>
  );
}
