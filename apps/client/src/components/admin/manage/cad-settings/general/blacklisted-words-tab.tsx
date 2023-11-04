import * as React from "react";
import { TabsContent } from "@radix-ui/react-tabs";
import type { GetBlacklistedWordsData } from "@snailycad/types/api";
import { Button, FullDate } from "@snailycad/ui";
import { SettingsTabs } from "components/admin/cad-settings/layout";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import useFetch from "lib/useFetch";
import { useTranslations } from "use-intl";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { AlertModal } from "components/modal/AlertModal";
import { SearchArea } from "components/shared/search/search-area";
import type { BlacklistedWord } from "@snailycad/types";
import { ImportBlacklistedWordsModal } from "./import-blacklisted-words-modal";

export function BlacklistedWordsTab() {
  const t = useTranslations("BlacklistedWords");
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const modalState = useModal();

  const [search, setSearch] = React.useState("");

  const asyncTable = useAsyncTable<BlacklistedWord>({
    search,
    sortingSchema: {
      createdAt: "createdAt",
      word: "word",
    },
    fetchOptions: {
      refetchOnWindowFocus: false,
      onResponse(data: GetBlacklistedWordsData) {
        return { totalCount: data.totalCount, data: data.blacklistedWords };
      },
      path: "/admin/manage/cad-settings/blacklisted-words",
    },
  });
  const [tempWord, wordState] = useTemporaryItem(asyncTable.items);
  const tableState = useTableState({ pagination: asyncTable.pagination });

  function onRemoveWordClick(word: BlacklistedWord) {
    wordState.setTempId(word.id);
    modalState.openModal(ModalIds.AlertRemoveBlacklistedWord);
  }

  async function handleRemoveWord() {
    if (!tempWord) return;

    const { json } = await execute({
      path: `/admin/manage/cad-settings/blacklisted-words/${tempWord.id}`,
      method: "DELETE",
    });

    if (typeof json === "boolean" && json) {
      wordState.setTempId(null);
      asyncTable.remove(tempWord.id);
      modalState.closeModal(ModalIds.AlertRemoveBlacklistedWord);
    }
  }

  return (
    <TabsContent value={SettingsTabs.BlacklistedWords}>
      <header className="mb-3 flex items-start justify-between">
        <div>
          <h2 className="font-semibold text-2xl">{t("blacklistedWords")}</h2>
          <p className="text-neutral-700 dark:text-gray-400">{t("blacklistedWordsDescription")}</p>
        </div>

        <div className="flex items-center gap-1">
          <Button onPress={() => modalState.openModal(ModalIds.ImportBlacklistedWords)}>
            {t("importBlacklistedWords")}
          </Button>
        </div>
      </header>

      <SearchArea
        asyncTable={asyncTable}
        search={{ search, setSearch }}
        totalCount={asyncTable.totalCount}
      />

      {asyncTable.noItemsAvailable ? (
        <p className="text-neutral-700 dark:text-gray-400 mt-2">{t("noBlacklistedWords")}</p>
      ) : (
        <>
          <Table
            data={asyncTable.items.map((word) => ({
              id: word.id,
              word: word.word,
              createdAt: <FullDate>{word.createdAt}</FullDate>,
              actions: (
                <Button onPress={() => onRemoveWordClick(word)} size="xs" variant="danger">
                  {t("remove")}
                </Button>
              ),
            }))}
            columns={[
              { header: t("word"), accessorKey: "word" },
              { header: common("createdAt"), accessorKey: "createdAt" },
              { header: common("actions"), accessorKey: "actions" },
            ]}
            tableState={tableState}
          />

          <AlertModal
            title={t("removeBlacklistedWord")}
            description={t.rich("removeBlacklistedWordDescription", {
              word: tempWord?.word,
              strong: (children) => <strong>{children}</strong>,
            })}
            onClose={() => wordState.setTempId(null)}
            onDeleteClick={handleRemoveWord}
            id={ModalIds.AlertRemoveBlacklistedWord}
            state={state}
          />
        </>
      )}

      <ImportBlacklistedWordsModal
        onImport={(words) => {
          asyncTable.prepend(...words);
        }}
      />
    </TabsContent>
  );
}
