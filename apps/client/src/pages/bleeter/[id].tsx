import * as React from "react";
import { Button } from "@snailycad/ui";
import { Layout } from "components/Layout";
import { useAuth } from "context/AuthContext";
import { getSessionUser } from "lib/auth";
import { handleRequest } from "lib/fetch";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { useTranslations } from "use-intl";
import { ModalIds } from "types/ModalIds";
import { useModal } from "state/modalState";
import useFetch from "lib/useFetch";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { useImageUrl } from "hooks/useImageUrl";
import { Title } from "components/shared/Title";
import { dataToSlate, Editor } from "components/editor/Editor";
import type { DeleteBleeterByIdData, GetBleeterByIdData } from "@snailycad/types/api";

const ManageBleetModal = dynamic(
  async () => (await import("components/bleeter/ManageBleetModal")).ManageBleetModal,
);

const AlertModal = dynamic(async () => (await import("components/modal/AlertModal")).AlertModal);

interface Props {
  post: GetBleeterByIdData;
}

export default function BleetPost({ post }: Props) {
  const { state, execute } = useFetch();
  const { user } = useAuth();
  const { openModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Bleeter");
  const router = useRouter();
  const { makeImageUrl } = useImageUrl();

  async function handleDelete() {
    const { json } = await execute<DeleteBleeterByIdData>({
      path: `/bleeter/${post.id}`,
      method: "DELETE",
    });

    if (json) {
      router.push("/bleeter");
    }
  }

  return (
    <Layout className="dark:text-white">
      <header className="flex items-center justify-between pb-2 border-b-2">
        <Title className="!mb-0">{post.title}</Title>

        <div>
          {user?.id === post.userId ? (
            <>
              <Button onPress={() => openModal(ModalIds.ManageBleetModal)} variant="success">
                {common("edit")}
              </Button>
              <Button
                onPress={() => openModal(ModalIds.AlertDeleteBleet)}
                className="ml-2"
                variant="danger"
              >
                {common("delete")}
              </Button>
            </>
          ) : null}
        </div>
      </header>

      <main className="mt-2 bleet-reset">
        {post.imageId ? (
          <img
            draggable={false}
            className="h-[20rem] mb-5 w-full object-cover"
            src={makeImageUrl("bleeter", post.imageId)}
            loading="lazy"
          />
        ) : null}
        <Editor isReadonly value={dataToSlate(post)} />
      </main>

      <ManageBleetModal post={post} />
      <AlertModal
        description={t.rich("alert_deleteBleet", {
          title: post.title,
          span: (chi) => <span className="font-semibold">{chi}</span>,
        })}
        id={ModalIds.AlertDeleteBleet}
        onDeleteClick={handleDelete}
        title={t("deleteBleet")}
        state={state}
      />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query, locale, req }) => {
  const user = await getSessionUser(req);
  const { data } = await handleRequest(`/bleeter/${query.id}`, {
    req,
  }).catch(() => ({ data: null }));

  if (!data) {
    return { notFound: true };
  }

  return {
    notFound: !data,
    props: {
      post: data,
      session: user,
      messages: {
        ...(await getTranslations(["bleeter", "common"], user?.locale ?? locale)),
      },
    },
  };
};
