import type { CourtDate } from "@snailycad/types";
import { Button } from "@snailycad/ui";
import { FullDate } from "components/shared/FullDate";
import { Table, useTableState } from "components/shared/Table";
import { useTranslations } from "next-intl";
import { ManageCourtDateModal } from "./ManageCourtDateModal";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { AlertModal } from "components/modal/AlertModal";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";

interface Props {
  dates: CourtDate[];
  onCreate(date: Pick<CourtDate, "date" | "note" | "id">): void;
  onUpdate(date: Pick<CourtDate, "date" | "note" | "id">): void;
  onDelete(date: Pick<CourtDate, "id">): void;
}

export function CourtEntryDates({ onUpdate, onDelete, onCreate, dates }: Props) {
  const [tempDate, dateState] = useTemporaryItem(dates);
  const common = useTranslations("Common");
  const t = useTranslations("Courthouse");
  const { closeModal, openModal } = useModal();
  const tableState = useTableState();

  function deleteCourtDate() {
    if (!tempDate) return;

    closeModal(ModalIds.AlertDeleteCourtDate);
    onDelete(tempDate);
    dateState.setTempId(null);
  }

  function handleDeleteClick(entry: CourtDate) {
    dateState.setTempId(entry.id);
    openModal(ModalIds.AlertDeleteCourtDate, entry);
  }

  function handleManageClick(entry: CourtDate) {
    dateState.setTempId(entry.id);
    openModal(ModalIds.ManageCourtDate);
  }

  return (
    <section className="mt-5 mb-10" id="dates">
      <header className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold">{t("dates")}</h3>

        <div>
          <Button onPress={() => openModal(ModalIds.ManageCourtDate)} type="button">
            {t("addDate")}
          </Button>
        </div>
      </header>

      <Table
        features={{ isWithinCardOrModal: true }}
        tableState={tableState}
        data={dates.map((date) => ({
          id: date.id,
          date: <FullDate onlyDate>{date.date}</FullDate>,
          note: date.note || common("none"),
          actions: (
            <>
              <Button
                type="button"
                onPress={() => handleManageClick(date)}
                variant="success"
                size="xs"
              >
                {common("edit")}
              </Button>
              <Button
                type="button"
                className="ml-2"
                onPress={() => handleDeleteClick(date)}
                variant="danger"
                size="xs"
              >
                {common("delete")}
              </Button>
            </>
          ),
        }))}
        columns={[
          { header: t("date"), accessorKey: "date" },
          { header: t("note"), accessorKey: "note" },
          { header: common("actions"), accessorKey: "actions" },
        ]}
      />

      <ManageCourtDateModal
        onClose={() => dateState.setTempId(null)}
        onCreate={(date) => {
          dateState.setTempId(null);
          onCreate(date);
        }}
        onUpdate={(date) => {
          dateState.setTempId(null);
          onUpdate(date);
        }}
        date={tempDate}
      />

      <AlertModal
        title={t("deleteCourtDate")}
        id={ModalIds.AlertDeleteCourtDate}
        description={t("alert_deleteCourtDate")}
        onDeleteClick={deleteCourtDate}
        onClose={() => dateState.setTempId(null)}
      />
    </section>
  );
}
