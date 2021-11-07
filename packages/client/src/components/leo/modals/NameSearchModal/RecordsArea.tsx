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

export type FullRecord = Record & { officer: FullOfficer; violations: PenalCode[] };
interface Props {
  records: FullRecord[];
}

export const RecordsArea = ({ records }: Props) => {
  const t = useTranslations();
  const router = useRouter();
  const isCitizen = router.pathname.startsWith("/citizen");

  const tickets = records.filter((v) => v.type === RecordType.TICKET);
  const writtenWarnings = records.filter((v) => v.type === RecordType.WRITTEN_WARNING);
  const arrestReports = records.filter((v) => v.type === RecordType.ARREST_REPORT);

  const data: [string, string, FullRecord[]][] = [
    [t("Leo.tickets"), t("Leo.noTicketsCitizen"), tickets],
    [t("Leo.writtenWarnings"), t("Leo.noWrittenWarnings"), writtenWarnings],
    [t("Leo.arrestReports"), t("Leo.noArrestReports"), arrestReports],
  ];

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

          {data!.length <= 0 ? <p>{noValuesText}</p> : <Table data={data} />}
        </section>
      ))}
    </div>
  );
};

const Table = ({ data }: { data: FullRecord[] }) => {
  const [tempItem, setTempItem] = React.useState<FullRecord | null>(null);
  const common = useTranslations("Common");
  const { openModal, closeModal } = useModal();
  const t = useTranslations();
  const router = useRouter();
  const isCitizen = router.pathname.startsWith("/citizen");
  const { state, execute } = useFetch();
  const generateCallsign = useGenerateCallsign();

  const { currentResult, setCurrentResult } = useNameSearch();

  function handleDeleteClick(record: FullRecord) {
    openModal(ModalIds.AlertDeleteRecord);
    setTempItem(record);
  }

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

      setTempItem(null);
      closeModal(ModalIds.AlertDeleteRecord);
    }
  }

  return (
    <div className="w-full mt-3 overflow-x-auto max-h-56">
      <table className="w-full overflow-hidden whitespace-nowrap">
        <thead className="sticky top-0">
          <tr>
            <th>{t("Leo.violations")}</th>
            <th>{t("Leo.postal")}</th>
            <th>{t("Leo.officer")}</th>
            <th>{common("description")}</th>
            <th>{common("createdAt")}</th>
            {isCitizen ? null : <th>{common("actions")}</th>}
          </tr>
        </thead>
        <tbody>
          {data
            .sort((a, b) => compareDesc(new Date(a.createdAt), new Date(b.createdAt)))
            .map((value) => (
              <tr key={value.id}>
                <td>{value.violations.map((v) => v.title).join(", ")}</td>
                <td>{value.postal}</td>
                <td>
                  {generateCallsign(value.officer)} {makeUnitName(value.officer)}
                </td>
                <td>{value.notes}</td>
                <td>{format(new Date(value.createdAt), "yyyy-MM-dd")}</td>
                {isCitizen ? null : (
                  <td>
                    <Button
                      type="button"
                      onClick={() => handleDeleteClick(value)}
                      small
                      variant="danger"
                    >
                      {common("delete")}
                    </Button>
                  </td>
                )}
              </tr>
            ))}
        </tbody>
      </table>

      <AlertModal
        id={ModalIds.AlertDeleteRecord}
        onDeleteClick={handleDelete}
        description={t("Leo.alert_deleteRecord")}
        title={t("Leo.deleteRecord")}
        state={state}
      />
    </div>
  );
};
