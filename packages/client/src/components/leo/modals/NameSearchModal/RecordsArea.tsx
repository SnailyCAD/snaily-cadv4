import compareDesc from "date-fns/compareDesc";
import { useRouter } from "next/router";
import { Record, RecordType, Violation, Warrant } from "@snailycad/types";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { ModalIds } from "types/ModalIds";
import { useModal } from "context/ModalContext";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { useNameSearch } from "state/nameSearchState";
import { makeUnitName } from "lib/utils";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import type { FullOfficer } from "state/dispatchState";
import { Table } from "components/shared/Table";
import { Select } from "components/form/Select";
import { ManageRecordModal } from "../ManageRecordModal";
import { FullDate } from "components/shared/FullDate";

export type FullRecord = Record & { officer: FullOfficer; violations: Violation[] };
interface Props {
  records: FullRecord[];
  warrants?: (Warrant & { officer: FullOfficer })[];
}

export function RecordsArea({ warrants, records }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const { state, execute } = useFetch();
  const isCitizen = router.pathname.startsWith("/citizen");
  const { getPayload, closeModal } = useModal();
  const { currentResult, setCurrentResult } = useNameSearch();

  const tempItem = getPayload<FullRecord>(ModalIds.AlertDeleteRecord);
  const tempEditRecord = getPayload<FullRecord>(ModalIds.ManageRecord);

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
      if (currentResult) {
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

          {data.length <= 0 ? (
            <p className="text-gray-400 my-2">{noValuesText}</p>
          ) : (
            <RecordsTable data={data} />
          )}
        </section>
      ))}

      {warrants ? (
        <section className="my-2 mb-5">
          <h3 className="text-xl font-semibold">{t("Leo.warrants")}</h3>

          {warrants.length <= 0 ? (
            <p className="text-gray-400 my-2">{t("Leo.noWarrants")}</p>
          ) : (
            <WarrantsTable data={warrants} />
          )}
        </section>
      ) : null}

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
  const { currentResult } = useNameSearch();

  function handleDeleteClick(record: FullRecord) {
    openModal(ModalIds.AlertDeleteRecord, record);
  }

  function handleEditClick(record: FullRecord) {
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
            violations: record.violations.map((v) => v.penalCode.title).join(", "),
            postal: record.postal,
            officer: `${generateCallsign(record.officer)} ${makeUnitName(record.officer)}`,
            description: record.notes,
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
          { Header: common("description"), accessor: "description" },
          { Header: common("createdAt"), accessor: "createdAt" },
          isCitizen ? null : { Header: common("actions"), accessor: "actions" },
        ]}
      />
    </div>
  );
}

const values = [
  { label: "Inactive", value: "inactive" },
  { label: "Active", value: "active" },
];

function WarrantsTable({ data }: { data: (Warrant & { officer: FullOfficer })[] }) {
  const common = useTranslations("Common");
  const { openModal, closeModal, getPayload } = useModal();
  const t = useTranslations();
  const generateCallsign = useGenerateCallsign();
  const { state, execute } = useFetch();
  const { currentResult, setCurrentResult } = useNameSearch();

  async function handleDelete() {
    const warrant = getPayload<Warrant>(ModalIds.AlertRevokeWarrant);
    if (!warrant) return;

    const { json } = await execute(`/records/${warrant.id}`, {
      data: { type: "WARRANT" },
      method: "DELETE",
    });

    if (json) {
      if (currentResult) {
        setCurrentResult({
          ...currentResult,
          warrants: currentResult.warrants.filter((v) => v.id !== warrant.id),
        });
      }

      closeModal(ModalIds.AlertRevokeWarrant);
    }
  }

  function handleDeleteClick(warrant: Warrant) {
    openModal(ModalIds.AlertRevokeWarrant, warrant);
  }

  async function handleChange(value: string, warrant: Warrant) {
    const { json } = await execute(`/records/warrant/${warrant.id}`, {
      data: { status: value.toUpperCase(), type: "WARRANT" },
      method: "PUT",
    });

    if (json && currentResult) {
      setCurrentResult({
        ...currentResult,
        warrants: currentResult.warrants.map((v) => {
          if (v.id === warrant.id) {
            return { ...v, ...json };
          }

          return v;
        }),
      });
    }
  }

  return (
    <div>
      <Table
        data={data
          .sort((a, b) => compareDesc(new Date(a.createdAt), new Date(b.createdAt)))
          .map((warrant) => {
            const value = values.find((v) => v.value === warrant.status.toLowerCase());

            return {
              officer: `${generateCallsign(warrant.officer)} ${makeUnitName(warrant.officer)}`,
              description: warrant.description,
              createdAt: <FullDate>{warrant.createdAt}</FullDate>,
              actions: (
                <div className="flex gap-2">
                  <Select
                    onChange={(e) => handleChange(e.target.value, warrant)}
                    className="w-40"
                    values={values}
                    value={value ?? null}
                  />
                  <Button
                    type="button"
                    onClick={() => handleDeleteClick(warrant)}
                    small
                    variant="danger"
                  >
                    {t("Leo.revoke")}
                  </Button>
                </div>
              ),
            };
          })}
        columns={[
          { Header: t("Leo.officer"), accessor: "officer" },
          { Header: common("description"), accessor: "description" },
          { Header: common("createdAt"), accessor: "createdAt" },
          { Header: common("actions"), accessor: "actions" },
        ]}
      />

      <AlertModal
        id={ModalIds.AlertRevokeWarrant}
        onDeleteClick={handleDelete}
        description={t("Leo.alert_revokeWarrant")}
        title={t("Leo.revokeWarrant")}
        deleteText={t("Leo.revoke")}
        state={state}
      />
    </div>
  );
}
