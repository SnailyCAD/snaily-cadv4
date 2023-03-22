import { useTranslations } from "use-intl";

import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { Button } from "@snailycad/ui";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import dynamic from "next/dynamic";
import { Title } from "components/shared/Title";
import type { GetBleeterData } from "@snailycad/types/api";
import { requestAll } from "lib/utils";
import { FullDate } from "components/shared/FullDate";
import { Editor } from "components/editor/editor";
import { ImageWrapper } from "components/shared/image-wrapper";
import { useImageUrl } from "hooks/useImageUrl";
import Link from "next/link";
import { useList } from "hooks/shared/table/use-list";

const ManageBleetModal = dynamic(
  async () => (await import("components/bleeter/manage-bleet-modal")).ManageBleetModal,
  { ssr: false },
);

interface Props {
  posts: GetBleeterData;
}

export default function Bleeter({ posts }: Props) {
  const t = useTranslations("Bleeter");
  const { openModal } = useModal();
  const { makeImageUrl } = useImageUrl();

  const list = useList({
    initialData: posts,
    totalCount: posts.length,
  });

  return (
    <Layout className="dark:text-white">
      <header className="flex items-center justify-between">
        <Title className="!mb-0">{t("bleeter")}</Title>

        <Button onPress={() => openModal(ModalIds.ManageBleetModal)}>{t("createBleet")}</Button>
      </header>

      {list.items.length <= 0 ? (
        <p className="mt-2">{t("noPosts")}</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {list.items.map((post) => (
            <li className="rounded-md shadow-sm" key={post.id}>
              <Link
                className="block p-4 card dark:hover:bg-secondary transition-colors"
                href={`/bleeter/${post.id}`}
              >
                <header className="flex gap-1 items-baseline">
                  <h3 className="text-lg font-semibold">{post.user.username}</h3>
                  <span className="font-bold text-base">∙</span>
                  <h4 className="text-base">
                    <FullDate relative>{post.createdAt}</FullDate>
                  </h4>
                </header>

                <div className="mx-1 mb-2">
                  <Editor hideBorder isReadonly value={post.bodyData} />
                </div>

                <div>
                  {post.imageId ? (
                    <ImageWrapper
                      quality={80}
                      width={1600}
                      height={320}
                      alt={post.title}
                      placeholder={post.imageBlurData ? "blur" : "empty"}
                      blurDataURL={post.imageBlurData ?? undefined}
                      draggable={false}
                      className="max-h-[20rem] mb-5 w-full object-cover rounded-lg shadow-md"
                      src={makeImageUrl("bleeter", post.imageId)!}
                      loading="lazy"
                    />
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <ManageBleetModal
        onUpdate={(bleet) => list.update(bleet.id, bleet)}
        onCreate={(bleet) => list.prepend(bleet)}
        post={null}
      />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ locale, req }) => {
  const user = await getSessionUser(req);
  const [bleeterData] = await requestAll(req, [["/bleeter", []]]);

  return {
    props: {
      posts: bleeterData,
      session: user,
      messages: {
        ...(await getTranslations(["bleeter", "common"], user?.locale ?? locale)),
      },
    },
  };
};
