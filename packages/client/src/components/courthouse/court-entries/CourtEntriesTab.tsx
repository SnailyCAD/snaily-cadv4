import * as React from "react";
import { Button } from "components/Button";
import { TabsContent } from "components/shared/TabList";
import { useModal } from "state/modalState";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { Table } from "components/shared/Table";
import type { CourtEntry } from "@snailycad/types";
import { FullDate } from "components/shared/FullDate";
import { ManageCourtEntry } from "./ManageCourtEntry";
import { DescriptionModal } from "components/modal/DescriptionModal/DescriptionModal";

interface Props {
  entries: CourtEntry[];
}

export function CourtEntriesTab(props: Props) {
  const [entries, setEntries] = React.useState(props.entries);
  const [tempEntry, setTempEntry] = React.useState<CourtEntry | null>(null);

  const t = useTranslations("Courthouse");
  const common = useTranslations("Common");
  const { openModal } = useModal();

  function handleViewDescription(entry: CourtEntry) {
    setTempEntry(entry);
    openModal(ModalIds.Description, entry);
  }

  return (
    <TabsContent value="courtEntriesTab">
      <header className="flex justify-between items-center">
        <h3 className="text-2xl font-semibold">{t("courtEntries")}</h3>

        <Button onClick={() => openModal(ModalIds.ManageCourtEntry)}>{t("addCourtEntry")}</Button>
      </header>

      {entries.length <= 0 ? (
        <p className="mt-5">{t("noCourtEntries")}</p>
      ) : (
        <Table
          defaultSort={{ columnId: "createdAt", descending: true }}
          data={entries.map((entry) => ({
            title: entry.title,
            createdAt: <FullDate>{entry.createdAt}</FullDate>,
            description: (
              <Button small onClick={() => handleViewDescription(entry)}>
                {common("viewDescription")}
              </Button>
            ),
          }))}
          columns={[
            { Header: t("title"), accessor: "title" },
            { Header: common("description"), accessor: "description" },
            { Header: common("createdAt"), accessor: "createdAt" },
          ]}
        />
      )}

      <ManageCourtEntry
        courtEntry={tempEntry}
        onCreate={(request) => setEntries((p) => [request, ...p])}
      />
      {tempEntry?.descriptionData ? (
        <DescriptionModal onClose={() => setTempEntry(null)} value={tempEntry.descriptionData} />
      ) : null}
    </TabsContent>
  );
}
