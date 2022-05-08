import * as React from "react";
import compareDesc from "date-fns/compareDesc";
import { useRouter } from "next/router";
import { Record, RecordType } from "@snailycad/types";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { ModalIds } from "types/ModalIds";
import { useModal } from "state/modalState";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { useNameSearch } from "state/search/nameSearchState";
import { makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { Table } from "components/shared/Table";
import { ManageRecordModal } from "../../ManageRecordModal";
import { FullDate } from "components/shared/FullDate";
import { HoverCard } from "components/shared/HoverCard";
import { dataToSlate, Editor } from "components/modal/DescriptionModal/Editor";
import { TabsContent } from "components/shared/TabList";

export function RecordsTab({ records, isCitizen }: { records: Record[]; isCitizen?: boolean }) {
  const t = useTranslations();
  const { state, execute } = useFetch();
  const { getPayload, closeModal } = useModal();
  const { currentResult, setCurrentResult } = useNameSearch();

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

  async function handleDelete() {
    if (!tempItem) return;

    const { json } = await execute(`/records/${tempItem.id}`, {
      method: "DELETE",
    });

    if (json) {
      if (currentResult) {
        setCurrentResult({
          ...currentResult,
          Record: currentResult.Record.filter((v) => v.id !== tempItem.id),
        });
      }

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
          onUpdate={(data) => {
            currentResult &&
              setCurrentResult({
                ...currentResult,
                Record: currentResult.Record.map((v) => {
                  if (v.id === data.id) return data;
                  return v;
                }),
              });
          }}
          id={ModalIds.ManageRecord}
          type={tempEditRecord.type}
          record={tempEditRecord}
          isEdit
        />
      ) : null}
    </ContentWrapper>
  );
}

function RecordsTable({ data }: { data: Record[] }) {
  const common = useTranslations("Common");
  const { openModal } = useModal();
  const t = useTranslations();
  const router = useRouter();
  const isCitizen = router.pathname.startsWith("/citizen");
  const { generateCallsign } = useGenerateCallsign();
  const { currentResult } = useNameSearch();

  function handleDeleteClick(record: Record) {
    openModal(ModalIds.AlertDeleteRecord, record);
  }

  function handleEditClick(record: Record) {
    openModal(ModalIds.ManageRecord, {
      ...record,
      citizenName: `${currentResult?.name} ${currentResult?.surname}`,
    });
  }

  return (
    <div>
      <Table
        data={data
          .sort((a, b) => compareDesc(new Date(a.createdAt), new Date(b.createdAt)))
          .map((record) => ({
            violations: record.violations.map((v, idx) => {
              const comma = idx !== record.violations.length - 1 ? ", " : "";
              return (
                <HoverCard
                  trigger={
                    <span>
                      {v.penalCode.title}
                      {comma}
                    </span>
                  }
                  key={v.id}
                >
                  <h3 className="text-lg font-semibold px-2">{v.penalCode.title}</h3>

                  <div className="dark:text-gray-200 mt-2 text-base">
                    <Editor isReadonly value={dataToSlate(v.penalCode)} />
                  </div>
                </HoverCard>
              );
            }),
            postal: record.postal,
            officer: `${generateCallsign(record.officer)} ${makeUnitName(record.officer)}`,
            notes: record.notes || common("none"),
            createdAt: <FullDate>{record.createdAt}</FullDate>,
            actions: isCitizen ? null : (
              <>
                <Button
                  type="button"
                  onClick={() => handleEditClick(record)}
                  small
                  variant="success"
                >
                  {common("edit")}
                </Button>

                <Button
                  className="ml-2"
                  type="button"
                  onClick={() => handleDeleteClick(record)}
                  small
                  variant="danger"
                >
                  {common("delete")}
                </Button>
              </>
            ),
          }))}
        columns={[
          { Header: t("Leo.violations"), accessor: "violations" },
          { Header: t("Leo.postal"), accessor: "postal" },
          { Header: t("Leo.officer"), accessor: "officer" },
          { Header: t("Leo.notes"), accessor: "notes" },
          { Header: common("createdAt"), accessor: "createdAt" },
          isCitizen ? null : { Header: common("actions"), accessor: "actions" },
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
