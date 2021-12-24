import * as React from "react";
import compareDesc from "date-fns/compareDesc";
import format from "date-fns/format";
import { useRouter } from "next/router";
import { PenalCode, Record, RecordType } from "types/prisma";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { ModalIds } from "types/ModalIds";
import { useModal } from "context/ModalContext";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { useNameSearch } from "state/nameSearchState";
import { makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { FullOfficer } from "state/dispatchState";
import { Table } from "components/table/Table";

export type FullRecord = Record & { officer: FullOfficer; violations: PenalCode[] };
interface Props {
  records: FullRecord[];
}

export function RecordsArea({ records }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const { state, execute } = useFetch();
  const isCitizen = router.pathname.startsWith("/citizen");
  const { getPayload, closeModal } = useModal();
  const { currentResult, setCurrentResult } = useNameSearch();
  const tempItem = getPayload<FullRecord>(ModalIds.AlertDeleteRecord);

  const tickets = records.filter((v) => v.type === RecordType.TICKET);
  const writtenWarnings = records.filter((v) => v.type === RecordType.WRITTEN_WARNING);
  const arrestReports = records.filter((v) => v.type === RecordType.ARREST_REPORT);

  const data: [string, string, FullRecord[]][] = [
    [t("Leo.tickets"), t("Leo.noTicketsCitizen"), tickets],
    [t("Leo.writtenWarnings"), t("Leo.noWrittenWarnings"), writtenWarnings],
    [t("Leo.arrestReports"), t("Leo.noArrestReports"), arrestReports],
  ];

  async function handleDelete() {
    if (!tempItem) return;

    const { json } = await execute(`/records/${tempItem.id}`, {
      method: "DELETE",
    });

    if (json) {
      if (typeof currentResult === "object" && currentResult) {
        setCurrentResult({
          ...currentResult,
          Record: currentResult.Record.filter((v) => v.id !== tempItem.id),
        });
      }

      closeModal(ModalIds.AlertDeleteRecord);
    }
  }

  return (
    <div className={isCitizen ? "bg-gray-200/60 p-4 dark:bg-gray-2 rounded-md" : ""}>
      {isCitizen ? (
        <header className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-semibold">{t("Leo.records")}</h1>
        </header>
      ) : null}

      {data.map(([title, noValuesText, data]) => (
        <section className="my-2 mb-5" key={title} id={title}>
          <h3 className="text-xl font-semibold">{title}</h3>

          {data!.length <= 0 ? <p>{noValuesText}</p> : <RecordsTable data={data} />}
        </section>
      ))}

      <AlertModal
        id={ModalIds.AlertDeleteRecord}
        onDeleteClick={handleDelete}
        description={t("Leo.alert_deleteRecord")}
        title={t("Leo.deleteRecord")}
        state={state}
      />
    </div>
  );
}

function RecordsTable({ data }: { data: FullRecord[] }) {
  const common = useTranslations("Common");
  const { openModal } = useModal();
  const t = useTranslations();
  const router = useRouter();
  const isCitizen = router.pathname.startsWith("/citizen");
  const generateCallsign = useGenerateCallsign();

  function handleDeleteClick(record: FullRecord) {
    openModal(ModalIds.AlertDeleteRecord, record);
  }

  return (
    <div>
      <Table
        data={data
          .sort((a, b) => compareDesc(new Date(a.createdAt), new Date(b.createdAt)))
          .map((record) => ({
            violations: record.violations.map((v) => v.title).join(", "),
            postal: record.postal,
            officer: `${generateCallsign(record.officer)} ${makeUnitName(record.officer)}`,
            description: record.notes,
            createdAt: format(new Date(record.createdAt), "yyyy-MM-dd"),
            actions: isCitizen ? null : (
              <Button
                type="button"
                onClick={() => handleDeleteClick(record)}
                small
                variant="danger"
              >
                {common("delete")}
              </Button>
            ),
          }))}
        columns={[
          {
            Header: t("Leo.violations"),
            accessor: "violations",
          },
          {
            Header: t("Leo.postal"),
            accessor: "postal",
          },
          {
            Header: t("Leo.officer"),
            accessor: "officer",
          },
          {
            Header: common("description"),
            accessor: "description",
          },
          {
            Header: common("createdAt"),
            accessor: "createdAt",
          },
          isCitizen
            ? null
            : {
                Header: common("actions"),
                accessor: "actions",
              },
        ]}
      />
    </div>
  );
}
