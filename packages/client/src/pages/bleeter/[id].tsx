import * as React from "react";
import { Button } from "components/Button";
import { Layout } from "components/Layout";
import { useAuth } from "context/AuthContext";
import { getSessionUser } from "lib/auth";
import { handleRequest } from "lib/fetch";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import type { BleeterPost } from "@snailycad/types";
import { useTranslations } from "use-intl";
import { ModalIds } from "types/ModalIds";
import { useModal } from "context/ModalContext";
import useFetch from "lib/useFetch";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { useImageUrl } from "hooks/useImageUrl";
import { Title } from "components/shared/Title";
import { dataToSlate, Editor } from "components/modal/DescriptionModal/Editor";

const ManageBleetModal = dynamic(
  async () => (await import("components/bleeter/ManageBleetModal")).ManageBleetModal,
);

const AlertModal = dynamic(async () => (await import("components/modal/AlertModal")).AlertModal);

interface Props {
  post: BleeterPost | null;
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
    if (!post) return;

    const { json } = await execute(`/bleeter/${post.id}`, { method: "DELETE" });

    if (json) {
      router.push("/bleeter");
    }
  }

  if (!post) {
    return null;
  }

  return (
    <Layout className="dark:text-white">
      <Title>{post.title}</Title>

      <header className="flex items-center justify-between pb-2 border-b-2">
        <h1 className="text-3xl font-semibold">{post.title}</h1>

        <div>
          {user?.id === post.userId ? (
            <>
              <Button onClick={() => openModal(ModalIds.ManageBleetModal)} variant="success">
                {common("edit")}
              </Button>
              <Button
                onClick={() => openModal(ModalIds.AlertDeleteBleet)}
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
  const { data } = await handleRequest(`/bleeter/${query.id}`, {
    req,
  }).catch(() => ({ data: null }));

  return {
    notFound: !data,
    props: {
      post: data,
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["bleeter", "common"], locale)),
      },
    },
  };
};
