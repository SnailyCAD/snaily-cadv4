import { GetBleeterProfileByHandleData } from "@snailycad/types/api";
import { Button, Loader } from "@snailycad/ui";
import { Layout } from "components/Layout";
import { BleeterPostsList } from "components/bleeter/list/posts-list";
import { FollowersFollowingModal } from "components/bleeter/modals/followers-following-modal";
import { Title } from "components/shared/Title";
import { useAuth } from "context/AuthContext";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import useFetch from "lib/useFetch";
import { requestAll } from "lib/utils";
import { GetServerSideProps } from "next";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";

interface BleeterProfilePageProps {
  data: GetBleeterProfileByHandleData;
}

export default function BleeterProfilePage(props: BleeterProfilePageProps) {
  const { openModal } = useModal();
  const { user } = useAuth();
  const { execute, state } = useFetch();

  async function handleFollow() {
    const { json } = await execute({
      path: `/bleeter/profiles/${props.data.handle}/follow`,
      method: "POST",
    });

    // todo: invalidate queries
    console.log({ json });
  }

  return (
    <Layout className="dark:text-white">
      <header className="flex flex-col md:flex-row justify-between">
        <div>
          <div className="flex gap-2">
            <Title renderLayoutTitle={false}>{props.data.name} - Bleeter</Title>
            {user?.id === props.data.userId ? null : (
              <Button onPress={handleFollow} className="flex gap-2 items-center" size="sm">
                {state === "loading" ? <Loader /> : null}
                Follow
              </Button>
            )}
          </div>
          <h1 className="text-3xl font-bold">{props.data.name}</h1>
          <h2 className="text-xl font-light text-neutral-800 dark:text-gray-300">
            @{props.data.handle}
          </h2>
          <p className="my-2 text-neutral-700 dark:text-gray-400">{props.data.bio}</p>
        </div>

        <ul className="flex gap-3">
          <li className="text-center">
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-gray-300">Posts</h3>
            <p>{props.data.postsCount}</p>
          </li>
          <li onClick={() => openModal(ModalIds.Followers)} className="text-center cursor-pointer">
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-gray-300">Followers</h3>
            <p>{props.data.followersCount}</p>
          </li>
          <li onClick={() => openModal(ModalIds.Following)} className="text-center cursor-pointer">
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-gray-300">Following</h3>
            <p>{props.data.followingCount}</p>
          </li>
        </ul>
      </header>

      <BleeterPostsList
        creator={props.data}
        posts={props.data.posts}
        totalCount={props.data.postsCount}
      />

      <FollowersFollowingModal profileHandle={props.data.handle} type="followers" />
      <FollowersFollowingModal profileHandle={props.data.handle} type="following" />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<BleeterProfilePageProps> = async ({
  locale,
  query,
  req,
}) => {
  const user = await getSessionUser(req);
  const [data] = await requestAll(req, [[`/bleeter/profiles/${query.handle}`, null]]);

  return {
    notFound: !data,
    props: {
      data,
      session: user,
      messages: {
        ...(await getTranslations(["bleeter", "common"], user?.locale ?? locale)),
      },
    },
  };
};
