import { PostEmsFdMedicalRecordsSearchData } from "@snailycad/types/api";
import { FullDate, TabsContent } from "@snailycad/ui";
import { CallDescription } from "components/dispatch/active-calls/CallDescription";
import { Table, useTableState } from "components/shared/Table";
import { useTranslations } from "use-intl";

interface DoctorVisitsTabProps {
  results: PostEmsFdMedicalRecordsSearchData;
}

export function DoctorVisitsTab(props: DoctorVisitsTabProps) {
  const tableState = useTableState();
  const t = useTranslations();

  if (!("DoctorVisit" in props.results)) {
    return null;
  }

  return (
    <TabsContent className="mt-7" value="doctor-visits">
      {props.results.DoctorVisit.length <= 0 ? (
        <p>No medical records</p>
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
    </TabsContent>
  );
}
