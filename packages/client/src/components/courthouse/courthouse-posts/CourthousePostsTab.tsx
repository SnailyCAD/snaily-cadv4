import * as React from "react";
import { Button } from "components/Button";
import { TabsContent } from "components/shared/TabList";
import { useModal } from "state/modalState";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { Table } from "components/shared/Table";
import type { CourthousePost } from "@snailycad/types";
import { FullDate } from "components/shared/FullDate";
import { ManageCourtEntry } from "./ManageCourtEntry";
import { DescriptionModal } from "components/modal/DescriptionModal/DescriptionModal";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";

interface Props {
  posts: CourthousePost[];
}

export function CourthousePostsTab(props: Props) {
  const [posts, setPosts] = React.useState(props.posts);
  const [tempPost, setTempPost] = React.useState<CourthousePost | null>(null);

  const t = useTranslations("Courthouse");
  const common = useTranslations("Common");
  const { openModal, closeModal } = useModal();
  const { state, execute } = useFetch();

  async function deleteCourtEntry() {
    if (!tempPost) return;

    const { json } = await execute(`/court-entries/${tempPost.id}`, { method: "DELETE" });

    if (typeof json === "boolean") {
      setPosts((p) => p.filter((v) => v.id !== tempPost.id));
      setTempPost(null);
      closeModal(ModalIds.AlertDeleteCourtEntry);
    }
  }

  function handleViewDescription(post: CourthousePost) {
    setTempPost(post);
    openModal(ModalIds.Description, post);
  }

  function handleManageClick(post: CourthousePost) {
    setTempPost(post);
    openModal(ModalIds.ManageCourtEntry);
  }

  function handleDeleteClick(post: CourthousePost) {
    setTempPost(post);
    openModal(ModalIds.AlertDeleteCourtEntry);
  }

  return (
    <TabsContent value="courtEntriesTab">
      <header className="flex justify-between items-center">
        <h3 className="text-2xl font-semibold">{t("courtEntries")}</h3>

        <Button onClick={() => openModal(ModalIds.ManageCourtEntry)}>{t("addCourtEntry")}</Button>
      </header>

      {posts.length <= 0 ? (
        <p className="mt-5">{t("noCourtEntries")}</p>
      ) : (
        <Table
          defaultSort={{ columnId: "createdAt", descending: true }}
          data={posts.map((entry) => ({
            title: entry.title,
            createdAt: <FullDate>{entry.createdAt}</FullDate>,
            description: (
              <Button small onClick={() => handleViewDescription(entry)}>
                {common("viewDescription")}
              </Button>
            ),
            actions: (
              <>
                <Button onClick={() => handleManageClick(entry)} small variant="success">
                  {common("manage")}
                </Button>
                <Button
                  onClick={() => handleDeleteClick(entry)}
                  className="ml-2"
                  small
                  variant="danger"
                >
                  {common("delete")}
                </Button>
              </>
            ),
          }))}
          columns={[
            { Header: t("title"), accessor: "title" },
            { Header: common("description"), accessor: "description" },
            { Header: common("createdAt"), accessor: "createdAt" },
            { Header: common("actions"), accessor: "actions" },
          ]}
        />
      )}

      <AlertModal
        id={ModalIds.AlertDeleteCourtEntry}
        title={t("deleteCourtEntry")}
        description={t("alert_deleteCourtEntry")}
        onDeleteClick={deleteCourtEntry}
        onClose={() => setTempPost(null)}
        state={state}
      />

      <ManageCourtEntry
        courtEntry={tempPost}
        onCreate={(entry) => setPosts((p) => [entry, ...p])}
        onUpdate={(entry) =>
          tempPost &&
          setPosts((p) => {
            const idx = p.indexOf(tempPost);
            p[idx] = entry;
            return p;
          })
        }
        onClose={() => setTempPost(null)}
      />
      {tempPost?.descriptionData ? (
        <DescriptionModal onClose={() => setTempPost(null)} value={tempPost.descriptionData} />
      ) : null}
    </TabsContent>
  );
}
