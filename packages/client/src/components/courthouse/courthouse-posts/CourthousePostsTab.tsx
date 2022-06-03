import * as React from "react";
import { Button } from "components/Button";
import { TabsContent } from "components/shared/TabList";
import { useModal } from "state/modalState";
import { useTranslations } from "next-intl";
import { ModalIds } from "types/ModalIds";
import { Table } from "components/shared/Table";
import type { CourthousePost } from "@snailycad/types";
import { FullDate } from "components/shared/FullDate";
import { ManageCourtPostModal } from "./ManageCourtPostModal";
import { DescriptionModal } from "components/modal/DescriptionModal/DescriptionModal";
import { AlertModal } from "components/modal/AlertModal";
import useFetch from "lib/useFetch";
import { usePermission, Permissions } from "hooks/usePermission";

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
  const { hasPermissions } = usePermission();
  const hasManagePermissions = hasPermissions([Permissions.ManageCourthousePosts], true);

  async function deleteCourthousePost() {
    if (!tempPost) return;

    const { json } = await execute(`/courthouse-posts/${tempPost.id}`, { method: "DELETE" });

    if (typeof json === "boolean") {
      setPosts((p) => p.filter((v) => v.id !== tempPost.id));
      setTempPost(null);
      closeModal(ModalIds.AlertDeleteCourthousePost);
    }
  }

  function handleViewDescription(post: CourthousePost) {
    setTempPost(post);
    openModal(ModalIds.Description, post);
  }

  function handleManageClick(post: CourthousePost) {
    setTempPost(post);
    openModal(ModalIds.ManageCourthousePost);
  }

  function handleDeleteClick(post: CourthousePost) {
    setTempPost(post);
    openModal(ModalIds.AlertDeleteCourthousePost);
  }

  return (
    <TabsContent value="courthousePosts">
      <header className="flex justify-between items-center">
        <h3 className="text-2xl font-semibold">{t("courthousePosts")}</h3>

        {hasManagePermissions ? (
          <Button onClick={() => openModal(ModalIds.ManageCourthousePost)}>
            {t("addCourthousePost")}
          </Button>
        ) : null}
      </header>

      {posts.length <= 0 ? (
        <p className="mt-5">{t("noCourthousePosts")}</p>
      ) : (
        <Table
          data={posts.map((post) => ({
            title: post.title,
            createdAt: <FullDate>{post.createdAt}</FullDate>,

            actions: (
              <>
                <Button small onClick={() => handleViewDescription(post)}>
                  {common("viewDescription")}
                </Button>
                {hasManagePermissions ? (
                  <>
                    <Button
                      className="ml-2"
                      onClick={() => handleManageClick(post)}
                      small
                      variant="success"
                    >
                      {common("manage")}
                    </Button>
                    <Button
                      onClick={() => handleDeleteClick(post)}
                      className="ml-2"
                      small
                      variant="danger"
                    >
                      {common("delete")}
                    </Button>
                  </>
                ) : null}
              </>
            ),
          }))}
          columns={[
            { Header: t("title"), accessor: "title" },
            { Header: common("createdAt"), accessor: "createdAt" },
            { Header: common("actions"), accessor: "actions" },
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
            onClose={() => setTempPost(null)}
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
            onClose={() => setTempPost(null)}
          />
        </>
      ) : null}

      {tempPost?.descriptionData ? (
        <DescriptionModal onClose={() => setTempPost(null)} value={tempPost.descriptionData} />
      ) : null}
    </TabsContent>
  );
}
