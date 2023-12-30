import type { PenalCode, RecordType } from "@snailycad/types";
import type { GetCitizenByIdRecordsData } from "@snailycad/types/api";
import { Button, FullDate, TabsContent } from "@snailycad/ui";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
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
  const { state, execute } = useFetch();
  const form = useFormikContext<ReturnType<typeof createInitialRecordValues>>();
  const features = useFeatureEnabled();

  const asyncTable = useAsyncTable<GetCitizenByIdRecordsData[number]>({
    totalCount: 12,
    fetchOptions: {
      pageSize: 12,
      path: `/records/drafts?type=${props.type}`,
      onResponse(json: GetCitizenByIdRecordsData) {
        return { data: json, totalCount: json.length };
      },
    },
  });
  const tableState = useTableState(asyncTable);

  function onContinueClick(record: GetCitizenByIdRecordsData[number]) {
    form.setValues(
      createInitialRecordValues({
        record: {
          ...record,
          publishStatus: "DRAFT",
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

  async function onDeleteClick(recordId: string) {
    const { json } = await execute<boolean>({
      path: `/records/drafts/${recordId}`,
      method: "DELETE",
    });

    if (typeof json === "boolean" && json) {
      asyncTable.remove(recordId);
    }
  }

  return (
    <TabsContent value="drafts-tab">
      <h3 className="text-xl font-semibold">{t("drafts")}</h3>

      <Table
        isLoading={asyncTable.isLoading}
        features={{ isWithinCardOrModal: true }}
        tableState={tableState}
        data={asyncTable.items.map((record) => ({
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
                isDisabled={state === "loading"}
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
