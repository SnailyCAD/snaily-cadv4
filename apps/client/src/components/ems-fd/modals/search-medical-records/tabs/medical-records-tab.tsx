import type { MedicalRecord, Value } from "@snailycad/types";
import type {
  DeleteCitizenMedicalRecordsData,
  PostEmsFdMedicalRecordsSearchData,
} from "@snailycad/types/api";
import { Button, TabsContent } from "@snailycad/ui";
import { Table, useTableState } from "components/shared/Table";
import { Permissions, usePermission } from "hooks/usePermission";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";
import dynamic from "next/dynamic";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { CallDescription } from "components/dispatch/active-calls/CallDescription";

interface MedicalRecordsTabProps {
  results: PostEmsFdMedicalRecordsSearchData;
  handleDeclare(): void;
  state: "loading" | "error" | null;
  setResults: React.Dispatch<
    React.SetStateAction<PostEmsFdMedicalRecordsSearchData | null | undefined>
  >;
}
const ManageMedicalRecordsModal = dynamic(
  async () =>
    (await import("components/citizen/medical-records/manage-medical-records-modal"))
      .ManageMedicalRecordsModal,
);

export function MedicalRecordsTab(props: MedicalRecordsTabProps) {
  const tableState = useTableState();
  const { hasPermissions } = usePermission();
  const hasDeclarePermissions = hasPermissions([Permissions.DeclareCitizenDead]);
  const t = useTranslations();
  const modalState = useModal();
  const { execute, state } = useFetch();

  function handleDeleteClick(record: MedicalRecord) {
    recordState.setTempId(record.id);
    modalState.openModal(ModalIds.AlertDeleteMedicalRecord);
  }

  function handleEditClick(record: MedicalRecord) {
    recordState.setTempId(record.id);
    modalState.openModal(ModalIds.ManageMedicalRecords);
  }

  function handleBloodgroupStateChange(prevState: MedicalRecord[], bloodGroup: Value | null) {
    return prevState.map((med) => ({ ...med, bloodGroup, bloodGroupId: bloodGroup?.id ?? null }));
  }

  async function handleDelete() {
    if (!tempRecord || !("dead" in props.results)) return;

    const { json } = await execute<DeleteCitizenMedicalRecordsData>({
      path: `/ems-fd/medical-records/${tempRecord.id}`,
      method: "DELETE",
    });

    if (json) {
      props.setResults({
        ...props.results,
        medicalRecords: medicalRecords.filter((v) => v.id !== tempRecord.id),
      });

      modalState.closeModal(ModalIds.AlertDeleteMedicalRecord);
      recordState.setTempId(null);
    }
  }

  const medicalRecords = "dead" in props.results ? props.results.medicalRecords : [];
  const [tempRecord, recordState] = useTemporaryItem(medicalRecords);

  if (!("dead" in props.results)) {
    return null;
  }

  return (
    <TabsContent value="medical-records">
      <header className="flex items-center justify-between my-3">
        <h1 className="text-xl font-semibold">{t("Ems.medicalRecords")}</h1>

        <Button size="xs" onPress={() => modalState.openModal(ModalIds.ManageMedicalRecords)}>
          {t("Ems.add")}
        </Button>
      </header>

      {props.results.medicalRecords.length <= 0 ? (
        <p>No medical records</p>
      ) : (
        <Table
          features={{ isWithinCardOrModal: true }}
          tableState={tableState}
          data={props.results.medicalRecords.map((record) => ({
            id: record.id,
            type: record.type,
            bloodGroup: record.bloodGroup?.value ?? t("Common.none"),
            description: <CallDescription data={record} />,
            actions: (
              <>
                <Button
                  className="ml-2"
                  onPress={() => handleEditClick(record)}
                  size="xs"
                  variant="success"
                >
                  {t("Common.edit")}
                </Button>
                <Button
                  className="ml-2"
                  onPress={() => handleDeleteClick(record)}
                  size="xs"
                  variant="danger"
                >
                  {t("Common.delete")}
                </Button>
              </>
            ),
          }))}
          columns={[
            { header: t("MedicalRecords.diseases"), accessorKey: "type" },
            { header: t("MedicalRecords.bloodGroup"), accessorKey: "bloodGroup" },
            { header: t("Common.description"), accessorKey: "description" },
            hasDeclarePermissions ? { header: t("Common.actions"), accessorKey: "actions" } : null,
          ]}
        />
      )}

      <ManageMedicalRecordsModal
        isEmsFd
        citizen={props.results}
        onCreate={(record) => {
          if (!("dead" in props.results)) return;

          props.setResults({
            ...props.results,
            medicalRecords: [
              ...handleBloodgroupStateChange(medicalRecords, record.bloodGroup),
              record,
            ],
          });

          modalState.closeModal(ModalIds.ManageMedicalRecords);
        }}
        onUpdate={(old, newR) => {
          if (!("dead" in props.results)) return;

          const copy = [...medicalRecords];
          const idx = copy.indexOf(old);
          copy[idx] = newR;

          props.setResults({
            ...props.results,
            medicalRecords: handleBloodgroupStateChange(copy, newR.bloodGroup),
          });
          modalState.closeModal(ModalIds.ManageMedicalRecords);
        }}
        medicalRecord={tempRecord}
        onClose={() => recordState.setTempId(null)}
      />
      <AlertModal
        onDeleteClick={handleDelete}
        description={t("MedicalRecords.alert_deleteMedicalRecord")}
        id={ModalIds.AlertDeleteMedicalRecord}
        title={t("MedicalRecords.deleteMedicalRecord")}
        state={state}
        onClose={() => recordState.setTempId(null)}
      />
    </TabsContent>
  );
}
