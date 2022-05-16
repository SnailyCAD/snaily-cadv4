import * as React from "react";
import type { CourtDate } from "@snailycad/types";
import { Button } from "components/Button";
import { FullDate } from "components/shared/FullDate";
import { Table } from "components/shared/Table";
import { useTranslations } from "next-intl";
import { ManageCourtDateModal } from "./ManageCourtDateModal";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { AlertModal } from "components/modal/AlertModal";

interface Props {
  dates: CourtDate[];
  onCreate(date: Pick<CourtDate, "date" | "note" | "id">): void;
  onUpdate(date: Pick<CourtDate, "date" | "note" | "id">): void;
  onDelete(date: Pick<CourtDate, "id">): void;
}

export function CourtEntryDates({ onUpdate, onDelete, onCreate, dates }: Props) {
  const [tempDate, setTempDate] = React.useState<CourtDate | null>(null);

  const common = useTranslations("Common");
  const t = useTranslations("Courthouse");
  const { closeModal, openModal } = useModal();

  async function deleteCourtDate() {
    if (!tempDate) return;

    closeModal(ModalIds.AlertDeleteCourtDate);
    onDelete(tempDate);
    setTempDate(null);
  }

  function handleDeleteClick(entry: CourtDate) {
    setTempDate(entry);
    openModal(ModalIds.AlertDeleteCourtDate, entry);
  }

  function handleManageClick(entry: CourtDate) {
    setTempDate(entry);
    openModal(ModalIds.ManageCourtDate);
  }

  return (
    <section className="mt-5 mb-10" id="dates">
      <header className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold">{t("dates")}</h3>

        <div>
          <Button onClick={() => openModal(ModalIds.ManageCourtDate)} type="button">
            {t("addDate")}
          </Button>
        </div>
      </header>

      <Table
        data={dates.map((date) => ({
          date: <FullDate onlyDate>{date.date}</FullDate>,
          note: date.note || common("none"),
          actions: (
            <>
              <Button type="button" onClick={() => handleManageClick(date)} variant="success" small>
                {common("edit")}
              </Button>
              <Button
                type="button"
                className="ml-2"
                onClick={() => handleDeleteClick(date)}
                variant="danger"
                small
              >
                {common("delete")}
              </Button>
            </>
          ),
        }))}
        columns={[
          { Header: t("date"), accessor: "date" },
          { Header: t("note"), accessor: "note" },
          { Header: common("actions"), accessor: "actions" },
        ]}
      />

      <ManageCourtDateModal
        onClose={() => setTempDate(null)}
        onCreate={(date) => {
          setTempDate(null);
          onCreate(date);
        }}
        onUpdate={(date) => {
          setTempDate(null);
          onUpdate(date);
        }}
        date={tempDate}
      />

      <AlertModal
        title={t("deleteCourtDate")}
        id={ModalIds.AlertDeleteCourtDate}
        description={t("alert_deleteCourtDate")}
        onDeleteClick={deleteCourtDate}
        onClose={() => setTempDate(null)}
      />
    </section>
  );
}
