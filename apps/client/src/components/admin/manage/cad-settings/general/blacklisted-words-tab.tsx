import * as React from "react";
import { TabsContent } from "@radix-ui/react-tabs";
import { GetBlacklistedWordsData } from "@snailycad/types/api";
import { Button, FullDate, Loader } from "@snailycad/ui";
import { SettingsTabs } from "components/admin/cad-settings/layout";
import { Table, useAsyncTable, useTableState } from "components/shared/Table";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { toastMessage } from "lib/toastMessage";
import useFetch from "lib/useFetch";
import { useTranslations } from "use-intl";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { AlertModal } from "components/modal/AlertModal";
import { SearchArea } from "components/shared/search/search-area";
import { BlacklistedWord } from "@snailycad/types";

export function BlacklistedWordsTab() {
  const t = useTranslations("BlacklistedWords");
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const tableState = useTableState();
  const modalState = useModal();

  const [search, setSearch] = React.useState("");

  const asyncTable = useAsyncTable<BlacklistedWord>({
    search,
    fetchOptions: {
      onResponse(data: GetBlacklistedWordsData) {
        return { totalCount: data.totalCount, data: data.blacklistedWords };
      },
      path: "/admin/manage/cad-settings/blacklisted-words",
    },
  });
  const [tempWord, wordState] = useTemporaryItem(asyncTable.items);

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
      <header className="mb-3">
        <h2 className="font-semibold text-2xl">{t("blacklistedWords")}</h2>
        <p className="text-neutral-700 dark:text-gray-400">{t("blacklistedWordsDescription")}</p>
      </header>

      <SearchArea
        asyncTable={asyncTable}
        search={{ search, setSearch }}
        totalCount={asyncTable.totalCount}
      />

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
        isLoading={asyncTable.isInitialLoading}
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
    </TabsContent>
  );
}
