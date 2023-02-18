import * as React from "react";
import compareDesc from "date-fns/compareDesc";
import { useRouter } from "next/router";
import { Record, RecordType } from "@snailycad/types";
import { useTranslations } from "use-intl";
import { Button } from "@snailycad/ui";
import { ModalIds } from "types/ModalIds";
import { useModal } from "state/modalState";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { useNameSearch } from "state/search/name-search-state";
import { makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { Table, useTableState } from "components/shared/Table";
import { ManageRecordModal } from "../../manage-record/manage-record-modal";
import { FullDate } from "components/shared/FullDate";
import { TabsContent } from "components/shared/TabList";
import { Permissions, usePermission } from "hooks/usePermission";
import { ViolationsColumn } from "components/leo/ViolationsColumn";
import type { DeleteRecordsByIdData } from "@snailycad/types/api";
import { Status } from "components/shared/Status";
import { shallow } from "zustand/shallow";
import { RecordsCaseNumberColumn } from "components/leo/records-case-number-column";

export function RecordsTab({ records, isCitizen }: { records: Record[]; isCitizen?: boolean }) {
  const t = useTranslations();
  const { state, execute } = useFetch();
  const { getPayload, closeModal } = useModal();
  const { currentResult, setCurrentResult } = useNameSearch(
    (state) => ({
      currentResult: state.currentResult,
      setCurrentResult: state.setCurrentResult,
    }),
    shallow,
  );

  const tempItem = getPayload<Record>(ModalIds.AlertDeleteRecord);
  const tempEditRecord = getPayload<Record>(ModalIds.ManageRecord);

  if (!currentResult && !isCitizen) {
    return null;
  }

  const tickets = records.filter((v) => v.type === RecordType.TICKET);
  const writtenWarnings = records.filter((v) => v.type === RecordType.WRITTEN_WARNING);
  const arrestReports = records.filter((v) => v.type === RecordType.ARREST_REPORT);

  const data: [string, string, string, Record[]][] = [
    ["tickets", t("Leo.tickets"), t("Leo.noTicketsCitizen"), tickets],
    ["writtenWarnings", t("Leo.writtenWarnings"), t("Leo.noWrittenWarnings"), writtenWarnings],
    ["arrestReports", t("Leo.arrestReports"), t("Leo.noArrestReports"), arrestReports],
  ];

  function handleRecordUpdate(data: Record) {
    if (!currentResult || currentResult.isConfidential) return;

    setCurrentResult({
      ...currentResult,
      Record: currentResult.Record.map((v) => {
        if (v.id === data.id) return data;
        return v;
      }),
    });
  }

  async function handleDelete() {
    if (!tempItem || !currentResult || currentResult.isConfidential) return;

    const { json } = await execute<DeleteRecordsByIdData>({
      path: `/records/${tempItem.id}`,
      method: "DELETE",
    });

    if (json) {
      setCurrentResult({
        ...currentResult,
        Record: currentResult.Record.filter((v) => v.id !== tempItem.id),
      });

      closeModal(ModalIds.AlertDeleteRecord);
    }
  }

  const ContentWrapper = isCitizen ? DivWrapper : React.Fragment;

  return (
    <ContentWrapper>
      {data.map(([value, title, noValuesText, data]) =>
        isCitizen ? (
          <React.Fragment key={value}>
            <h3 className="text-xl font-semibold">{title}</h3>

            {data.length <= 0 ? (
              <p className="text-neutral-700 dark:text-gray-400 my-2">{noValuesText}</p>
            ) : (
              <RecordsTable data={data} />
            )}
          </React.Fragment>
        ) : (
          <TabsContent value={value} className="mt-3" key={value}>
            <h3 className="text-xl font-semibold">{title}</h3>

            {data.length <= 0 ? (
              <p className="text-neutral-700 dark:text-gray-400 my-2">{noValuesText}</p>
            ) : (
              <RecordsTable data={data} />
            )}
          </TabsContent>
        ),
      )}

      <AlertModal
        id={ModalIds.AlertDeleteRecord}
        onDeleteClick={handleDelete}
        description={t("Leo.alert_deleteRecord")}
        title={t("Leo.deleteRecord")}
        state={state}
      />

      {tempEditRecord ? (
        <ManageRecordModal
          onUpdate={handleRecordUpdate}
          id={ModalIds.ManageRecord}
          type={tempEditRecord.type}
          record={tempEditRecord}
          isEdit
        />
      ) : null}
    </ContentWrapper>
  );
}

export function RecordsTable({
  data,
  hasDeletePermissions,
  onDelete,
  onEdit,
}: {
  onEdit?(record: Record): void;
  onDelete?(record: Record): void;
  hasDeletePermissions?: boolean;
  data: Record[];
}) {
  const common = useTranslations("Common");
  const { openModal } = useModal();
  const t = useTranslations();
  const router = useRouter();

  const isCitizenCreation = router.pathname === "/citizen/create";
  const isCitizen = router.pathname.startsWith("/citizen") && !isCitizenCreation;

  const { generateCallsign } = useGenerateCallsign();
  const currentResult = useNameSearch((state) => state.currentResult);
  const tableState = useTableState();
  const currency = common("currency");

  const { hasPermissions } = usePermission();
  const _hasDeletePermissions =
    hasDeletePermissions ??
    hasPermissions(
      [
        Permissions.ManageExpungementRequests,
        Permissions.ManageNameChangeRequests,
        Permissions.DeleteCitizenRecords,
      ],
      (u) => u.isSupervisor,
    );

  function handleDeleteClick(record: Record) {
    if (onDelete) {
      onDelete(record);
      return;
    }

    if (!_hasDeletePermissions) return;
    openModal(ModalIds.AlertDeleteRecord, record);
  }

  function handleEditClick(record: Record) {
    if (onEdit) {
      onEdit(record);
      return;
    }

    openModal(ModalIds.ManageRecord, {
      ...record,
      citizenName: `${currentResult?.name} ${currentResult?.surname}`,
    });
  }

  return (
    <div>
      <Table
        features={{ isWithinCardOrModal: !isCitizenCreation }}
        tableState={tableState}
        data={data
          .sort((a, b) => compareDesc(new Date(a.createdAt), new Date(b.createdAt)))
          .map((record) => {
            function totalCost(): number {
              let sum = 0;

              for (const violation of record.violations) {
                if (!violation.fine) continue;
                const counts = violation.counts ? violation.counts : 1;

                sum += counts * violation.fine;
              }

              return sum;
            }

            function formatSum(sum: number) {
              return Intl.NumberFormat().format(sum);
            }

            return {
              type: (
                <span className="capitalize">{record.type.toLowerCase().replace("_", " ")}</span>
              ),
              id: record.id,
              caseNumber: <RecordsCaseNumberColumn record={record} />,
              violations: <ViolationsColumn violations={record.violations} />,
              postal: record.postal,
              officer: record.officer
                ? `${generateCallsign(record.officer)} ${makeUnitName(record.officer)}`
                : common("none"),
              paymentStatus: <Status fallback="—">{record.paymentStatus}</Status>,
              totalCost: `${currency}${formatSum(totalCost())}`,
              notes: record.notes || common("none"),
              // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
              createdAt: record.createdAt ? <FullDate>{record.createdAt}</FullDate> : "-",
              actions: isCitizen ? null : (
                <>
                  <Button
                    type="button"
                    onPress={() => handleEditClick(record)}
                    size="xs"
                    variant="success"
                  >
                    {common("edit")}
                  </Button>

                  {_hasDeletePermissions ? (
                    <Button
                      className="ml-2"
                      type="button"
                      onPress={() => handleDeleteClick(record)}
                      size="xs"
                      variant="danger"
                    >
                      {common("delete")}
                    </Button>
                  ) : null}
                </>
              ),
            };
          })}
        columns={[
          isCitizenCreation ? { header: common("type"), accessorKey: "type" } : null,
          isCitizenCreation ? null : { header: t("Leo.caseNumber"), accessorKey: "caseNumber" },
          { header: t("Leo.violations"), accessorKey: "violations" },
          { header: t("Leo.postal"), accessorKey: "postal" },
          { header: t("Leo.officer"), accessorKey: "officer" },
          { header: t("Leo.paymentStatus"), accessorKey: "paymentStatus" },
          isCitizen ? { header: t("Leo.totalCost"), accessorKey: "totalCost" } : null,
          { header: t("Leo.notes"), accessorKey: "notes" },
          isCitizenCreation ? null : { header: common("createdAt"), accessorKey: "createdAt" },
          isCitizen ? null : { header: common("actions"), accessorKey: "actions" },
        ]}
      />
    </div>
  );
}

function DivWrapper({ children }: any) {
  const t = useTranslations("Leo");

  return (
    <div className="p-4 card">
      <h1 className="text-3xl font-semibold mb-5">{t("records")}</h1>

      {children}
    </div>
  );
}
