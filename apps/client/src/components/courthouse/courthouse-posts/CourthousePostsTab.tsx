import * as React from "react";
import { Button, TabsContent } from "@snailycad/ui";
import { useModal } from "state/modalState";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { Table, useTableState } from "components/shared/Table";
import type { CourthousePost } from "@snailycad/types";
import { FullDate } from "components/shared/FullDate";
import { ManageCourtPostModal } from "./ManageCourtPostModal";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { usePermission, Permissions } from "hooks/usePermission";
import type { DeleteCourthousePostsData, GetCourthousePostsData } from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";
import { CallDescription } from "components/dispatch/active-calls/CallDescription";

interface Props {
  posts: GetCourthousePostsData;
}

export function CourthousePostsTab(props: Props) {
  const [posts, setPosts] = React.useState(props.posts);
  const [tempPost, postState] = useTemporaryItem(posts);

  const t = useTranslations("Courthouse");
  const common = useTranslations("Common");
  const { openModal, closeModal } = useModal();
  const { state, execute } = useFetch();
  const { hasPermissions } = usePermission();
  const hasManagePermissions = hasPermissions([Permissions.ManageCourthousePosts], true);
  const tableState = useTableState();

  async function deleteCourthousePost() {
    if (!tempPost) return;

    const { json } = await execute<DeleteCourthousePostsData>({
      path: `/courthouse-posts/${tempPost.id}`,
      method: "DELETE",
    });

    if (typeof json === "boolean") {
      setPosts((p) => p.filter((v) => v.id !== tempPost.id));
      postState.setTempId(null);
      closeModal(ModalIds.AlertDeleteCourthousePost);
    }
  }

  function handleManageClick(post: CourthousePost) {
    postState.setTempId(post.id);
    openModal(ModalIds.ManageCourthousePost);
  }

  function handleDeleteClick(post: CourthousePost) {
    postState.setTempId(post.id);
    openModal(ModalIds.AlertDeleteCourthousePost);
  }

  return (
    <TabsContent value="courthousePosts">
      <header className="flex justify-between items-center">
        <h3 className="text-2xl font-semibold">{t("courthousePosts")}</h3>

        {hasManagePermissions ? (
          <Button onPress={() => openModal(ModalIds.ManageCourthousePost)}>
            {t("addCourthousePost")}
          </Button>
        ) : null}
      </header>

      {posts.length <= 0 ? (
        <p className="mt-5">{t("noCourthousePosts")}</p>
      ) : (
        <Table
          tableState={tableState}
          data={posts.map((post) => ({
            id: post.id,
            title: post.title,
            createdAt: <FullDate>{post.createdAt}</FullDate>,
            description: <CallDescription nonCard data={post} />,
            actions: hasManagePermissions ? (
              <>
                <Button
                  className="ml-2"
                  onPress={() => handleManageClick(post)}
                  size="xs"
                  variant="success"
                >
                  {common("manage")}
                </Button>
                <Button
                  onPress={() => handleDeleteClick(post)}
                  className="ml-2"
                  size="xs"
                  variant="danger"
                >
                  {common("delete")}
                </Button>
              </>
            ) : null,
          }))}
          columns={[
            { header: t("title"), accessorKey: "title" },
            { header: t("description"), accessorKey: "description" },
            { header: common("createdAt"), accessorKey: "createdAt" },
            hasManagePermissions ? { header: common("actions"), accessorKey: "actions" } : null,
          ]}
        />
      )}

      {hasManagePermissions ? (
        <>
          <AlertModal
            id={ModalIds.AlertDeleteCourthousePost}
            title={t("deleteCourthousePost")}
            description={t("alert_deleteCourthousePost")}
            onDeleteClick={deleteCourthousePost}
            onClose={() => postState.setTempId(null)}
            state={state}
          />
          <ManageCourtPostModal
            post={tempPost}
            onCreate={(post) => setPosts((p) => [post, ...p])}
            onUpdate={(post) =>
              tempPost &&
              setPosts((p) => {
                const idx = p.indexOf(tempPost);
                p[idx] = post;
                return p;
              })
            }
            onClose={() => postState.setTempId(null)}
          />
        </>
      ) : null}
    </TabsContent>
  );
}
