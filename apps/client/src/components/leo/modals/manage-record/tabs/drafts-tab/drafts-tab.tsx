import type { PenalCode, RecordType } from "@snailycad/types";
import type { GetCitizenByIdRecordsData } from "@snailycad/types/api";
import { Button, FullDate, TabsContent } from "@snailycad/ui";
import { useQuery } from "@tanstack/react-query";
import { Table, useTableState } from "components/shared/Table";
import { useFormikContext } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "use-intl";
import { createInitialRecordValues } from "../../manage-record-modal";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";

interface DraftsTabProps {
  type: RecordType;
  payload: {
    citizenId?: string | undefined;
    citizenName?: string | undefined;
    businessId?: string | undefined;
    businessName?: string | undefined;
  } | null;
  penalCodes: PenalCode[];
  setActiveTab(str: string): void;
}

export function DraftsTab(props: DraftsTabProps) {
  const t = useTranslations("Leo");
  const { execute } = useFetch();
  const tableState = useTableState();
  const form = useFormikContext<ReturnType<typeof createInitialRecordValues>>();
  const features = useFeatureEnabled();

  const draftRecordsQuery = useQuery<GetCitizenByIdRecordsData>({
    queryKey: ["draft-records", props.type],
    queryFn: async () => {
      const { json } = await execute<GetCitizenByIdRecordsData>({
        path: `/records/drafts?type=${props.type}`,
        method: "GET",
      });

      return json;
    },
  });

  function onContinueClick(record: GetCitizenByIdRecordsData[number]) {
    form.setValues(
      createInitialRecordValues({
        record: {
          ...record,
          publishStatus: "PUBLISHED",
        },
        type: props.type,
        t,
        isLeoBailEnabled: features.LEO_BAIL,
        payload: {
          citizenName: record.citizen
            ? `${record.citizen.name} ${record.citizen.surname}`
            : undefined,
          citizenId: record.citizen?.id,
          businessId: record.business?.id,
          businessName: record.business?.name,
        },
        penalCodes: props.penalCodes,
      }),
    );
    props.setActiveTab("general-information-tab");
  }

  function onDeleteClick(recordId: string) {
    void 0;
  }

  return (
    <TabsContent value="drafts-tab">
      <h3 className="text-xl font-semibold">{t("drafts")}</h3>

      <Table
        features={{ isWithinCardOrModal: true }}
        tableState={tableState}
        data={(draftRecordsQuery.data ?? [])?.map((record) => ({
          id: record.id,
          name: `${record.citizen?.name} ${record.citizen?.surname}`,
          updatedAt: <FullDate>{new Date(record.updatedAt)}</FullDate>,
          actions: (
            <>
              <Button size="xs" type="button" onClick={() => onContinueClick(record)}>
                Continue
              </Button>
              <Button
                className="ml-2"
                variant="danger"
                size="xs"
                type="button"
                onClick={() => onDeleteClick(record.id)}
              >
                Delete
              </Button>
            </>
          ),
        }))}
        columns={[
          { header: "Name", accessorKey: "name" },
          { header: "Last updated", accessorKey: "updatedAt" },
          { header: "actions", accessorKey: "actions" },
        ]}
      />
    </TabsContent>
  );
}
