import type { PostEmsFdMedicalRecordsSearchData } from "@snailycad/types/api";
import { Button, FullDate, TabsContent } from "@snailycad/ui";
import { CallDescription } from "components/dispatch/active-calls/CallDescription";
import { Table, useTableState } from "components/shared/Table";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";
import { CreateDoctorVisitModal } from "../../doctor-visits/create-doctor-visit-modal";

interface DoctorVisitsTabProps {
  results: PostEmsFdMedicalRecordsSearchData;
  setResults: React.Dispatch<
    React.SetStateAction<PostEmsFdMedicalRecordsSearchData | null | undefined>
  >;
}

export function DoctorVisitsTab(props: DoctorVisitsTabProps) {
  const tableState = useTableState();
  const t = useTranslations();
  const modalState = useModal();

  if (!("DoctorVisit" in props.results)) {
    return null;
  }

  return (
    <TabsContent value="doctor-visits">
      <header className="flex items-center justify-between my-3">
        <h1 className="text-xl font-semibold">{t("Ems.doctorVisits")}</h1>

        <Button size="xs" onPress={() => modalState.openModal(ModalIds.CreateDoctorVisit)}>
          {t("Ems.add")}
        </Button>
      </header>

      {props.results.DoctorVisit.length <= 0 ? (
        <p>{t("Ems.noDoctorVisits")}</p>
      ) : (
        <Table
          features={{ isWithinCardOrModal: true }}
          tableState={tableState}
          data={props.results.DoctorVisit.map((record) => ({
            id: record.id,
            diagnosis: <CallDescription data={{ description: record.diagnosis }} />,
            conditions: <CallDescription data={{ description: record.conditions }} />,
            medications: <CallDescription data={{ description: record.medications }} />,
            createdAt: <FullDate>{record.createdAt}</FullDate>,
            description: record.description ? (
              <CallDescription data={{ description: record.description }} />
            ) : (
              t("Common.none")
            ),
          }))}
          columns={[
            { header: t("Ems.diagnosis"), accessorKey: "diagnosis" },
            { header: t("Ems.conditions"), accessorKey: "conditions" },
            { header: t("Ems.medications"), accessorKey: "medications" },
            { header: t("Common.createdAt"), accessorKey: "createdAt" },
            { header: t("Common.description"), accessorKey: "description" },
          ]}
        />
      )}

      <CreateDoctorVisitModal
        onCreate={(doctorVisit) => {
          if (!("DoctorVisit" in props.results)) return;

          props.setResults({
            ...props.results,
            DoctorVisit: [...props.results.DoctorVisit, doctorVisit],
          });

          modalState.closeModal(ModalIds.ManageMedicalRecords);
        }}
        citizen={props.results}
      />
    </TabsContent>
  );
}
