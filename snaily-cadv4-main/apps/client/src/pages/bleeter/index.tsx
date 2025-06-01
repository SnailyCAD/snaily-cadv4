import { useTranslations } from "use-intl";

import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import type { GetServerSideProps } from "next";
import { Button, buttonVariants } from "@snailycad/ui";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import dynamic from "next/dynamic";
import { Title } from "components/shared/Title";
import type { GetBleeterData } from "@snailycad/types/api";
import { requestAll } from "lib/utils";
import { useList } from "hooks/shared/table/use-list";
import { NewBleeterExperienceForm } from "components/bleeter/new-bleeter-experience";
import { BleeterPostsList } from "components/bleeter/list/posts-list";
import Link from "next/link";

const ManageBleetModal = dynamic(
  async () => (await import("components/bleeter/manage-bleet-modal")).ManageBleetModal,
  { ssr: false },
);

interface Props {
  data: GetBleeterData;
}

export default function Bleeter({ data }: Props) {
  const t = useTranslations("Bleeter");
  const modalState = useModal();

  const list = useList({
    initialData: data.posts,
    totalCount: data.totalCount,
  });

  if (!data.userBleeterProfile) {
    return <NewBleeterExperienceForm />;
  }

  return (
    <Layout className="dark:text-white">
      <header className="flex items-center justify-between">
        <Title className="!mb-0">{t("bleeter")}</Title>

        <div className="flex gap-2">
          <Button onPress={() => modalState.openModal(ModalIds.ManageBleetModal)}>
            {t("createBleet")}
          </Button>
          <Link className={buttonVariants()} href={`/bleeter/@/${data.userBleeterProfile.handle}`}>
            {t("myProfile")}
          </Link>
        </div>
      </header>

      {list.items.length <= 0 ? (
        <p className="mt-2">{t("noPosts")}</p>
      ) : (
        <BleeterPostsList {...data} />
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
  const [bleeterData] = await requestAll(req, [
    ["/bleeter", { posts: [], totalCount: 0, userBleeterProfile: null }],
  ]);

  return {
    props: {
      data: bleeterData,
      session: user,
      messages: {
        ...(await getTranslations(["bleeter", "common"], user?.locale ?? locale)),
      },
    },
  };
};
