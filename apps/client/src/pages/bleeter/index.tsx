import { useTranslations } from "use-intl";
import Link from "next/link";

import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { Button, buttonVariants } from "@snailycad/ui";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import dynamic from "next/dynamic";
import { Title } from "components/shared/Title";
import { classNames } from "lib/classNames";
import type { GetBleeterData } from "@snailycad/types/api";
import { requestAll } from "lib/utils";

const ManageBleetModal = dynamic(
  async () => (await import("components/bleeter/ManageBleetModal")).ManageBleetModal,
);

interface Props {
  posts: GetBleeterData;
}

export default function Bleeter({ posts }: Props) {
  const t = useTranslations("Bleeter");
  const { openModal } = useModal();

  return (
    <Layout className="dark:text-white">
      <header className="flex items-center justify-between">
        <Title className="!mb-0">{t("bleeter")}</Title>

        <Button onPress={() => openModal(ModalIds.ManageBleetModal)}>{t("createBleet")}</Button>
      </header>

      {posts.length <= 0 ? (
        <p className="mt-2">{t("noPosts")}</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {posts.map((post) => (
            <li
              className="flex items-start justify-between p-4 rounded-md shadow-sm card"
              key={post.id}
            >
              <div>
                <h1 className="text-2xl font-semibold">{post.title}</h1>
                <h3>{post.user.username}</h3>
              </div>

              <div>
                <Link href={`/bleeter/${post.id}`}>
                  <a
                    className={classNames(buttonVariants.default, "p-1 px-4 rounded-md")}
                    href={`/bleeter/${post.id}`}
                  >
                    {t("viewBleet")}
                  </a>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ManageBleetModal post={null} />
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
