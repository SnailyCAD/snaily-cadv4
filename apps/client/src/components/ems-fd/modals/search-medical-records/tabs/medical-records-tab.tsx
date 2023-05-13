import { PostEmsFdMedicalRecordsSearchData } from "@snailycad/types/api";
import { Button, TabsContent } from "@snailycad/ui";
import { Table, useTableState } from "components/shared/Table";
import { Permissions, usePermission } from "hooks/usePermission";
import { useTranslations } from "use-intl";

interface MedicalRecordsTabProps {
  results: PostEmsFdMedicalRecordsSearchData;
  handleDeclare(): void;
  state: "loading" | "error" | null;
}

export function MedicalRecordsTab(props: MedicalRecordsTabProps) {
  const tableState = useTableState();
  const { hasPermissions } = usePermission();
  const hasDeclarePermissions = hasPermissions([Permissions.DeclareCitizenDead]);
  const t = useTranslations();

  if (!("dead" in props.results)) {
    return null;
  }
  const isDead = props.results.dead;

  return (
    <TabsContent className="mt-7" value="medical-records">
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
            description: record.description || t("Common.none"),
            actions: (
              <Button
                size="xs"
                variant={isDead ? "success" : "danger"}
                type="button"
                onPress={() => props.handleDeclare()}
                disabled={!hasDeclarePermissions || props.state === "loading"}
              >
                {isDead ? t("Ems.declareAlive") : t("Ems.declareDead")}
              </Button>
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
    </TabsContent>
  );
}
