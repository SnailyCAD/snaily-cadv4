import { BreadcrumbItem, Breadcrumbs, Button } from "@snailycad/ui";
import { Layout } from "components/Layout";
import { useAuth } from "context/AuthContext";
import { getSessionUser } from "lib/auth";
import { handleRequest } from "lib/fetch";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { useTranslations } from "use-intl";
import { ModalIds } from "types/modal-ids";
import { useModal } from "state/modalState";
import useFetch from "lib/useFetch";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { useImageUrl } from "hooks/useImageUrl";
import { Title } from "components/shared/Title";
import { dataToSlate, Editor } from "components/editor/editor";
import type { DeleteBleeterByIdData, GetBleeterByIdData } from "@snailycad/types/api";
import { ImageWrapper } from "components/shared/image-wrapper";
import Link from "next/link";
import { classNames } from "lib/classNames";
import { usePermission } from "hooks/usePermission";
import { defaultPermissions } from "@snailycad/permissions";

const ManageBleetModal = dynamic(
  async () => (await import("components/bleeter/manage-bleet-modal")).ManageBleetModal,
  { ssr: false },
);

const AlertModal = dynamic(async () => (await import("components/modal/AlertModal")).AlertModal, {
  ssr: false,
});

interface Props {
  post: GetBleeterByIdData;
}

export default function BleetPost({ post }: Props) {
  const { state, execute } = useFetch();
  const { user } = useAuth();
  const modalState = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Bleeter");
  const router = useRouter();
  const { makeImageUrl } = useImageUrl();

  const { hasPermissions } = usePermission();
  const hasManagePermissions = hasPermissions(defaultPermissions.defaultManagementPermissions);

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
      <Breadcrumbs>
        <BreadcrumbItem href="/bleeter">{t("bleeter")}</BreadcrumbItem>
        <BreadcrumbItem href={`/bleeter/${post.id}`}>{post.title}</BreadcrumbItem>
      </Breadcrumbs>

      <header className="flex items-center justify-between pb-2 border-b-2">
        <div className="flex flex-col">
          <Title className="!mb-0 !font-bold">{post.title}</Title>
          <h2
            className={classNames(
              "font-medium dark:text-gray-400 text-neutral-700 text-lg",
              post.creator && "underline",
            )}
          >
            {post.creator ? (
              <Link href={`/bleeter/@/${post.creator.handle}`}>{post.creator.name}</Link>
            ) : (
              post.user.username
            )}
          </h2>
        </div>

        <div>
          {user?.id === post.userId ? (
            <Button
              onPress={() => modalState.openModal(ModalIds.ManageBleetModal)}
              variant="success"
            >
              {common("edit")}
            </Button>
          ) : null}

          {user?.id === post.userId || hasManagePermissions ? (
            <Button
              onPress={() => modalState.openModal(ModalIds.AlertDeleteBleet)}
              className="ml-2"
              variant="danger"
            >
              {common("delete")}
            </Button>
          ) : null}
        </div>
      </header>

      <main className="mt-2 bleet-reset">
        {post.imageId ? (
          <ImageWrapper
            quality={100}
            width={1600}
            height={320}
            alt={post.title}
            placeholder={post.imageBlurData ? "blur" : "empty"}
            blurDataURL={post.imageBlurData ?? undefined}
            draggable={false}
            className="max-h-[20rem] mb-5 w-full object-cover"
            src={makeImageUrl("bleeter", post.imageId)!}
            loading="lazy"
          />
        ) : null}
        <Editor hideBorder isReadonly value={dataToSlate(post)} />
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
    props: {
      post: data,
      session: user,
      messages: {
        ...(await getTranslations(["bleeter", "common"], user?.locale ?? locale)),
      },
    },
  };
};
