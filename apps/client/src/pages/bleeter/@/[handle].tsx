import { GetBleeterProfileByHandleData } from "@snailycad/types/api";
import { Button, Loader } from "@snailycad/ui";
import { Layout } from "components/Layout";
import { BleeterPostsList } from "components/bleeter/list/posts-list";
import {
  FollowersFollowingModal,
  useFollowers,
  useFollowing,
} from "components/bleeter/modals/followers-following-modal";
import { Title } from "components/shared/Title";
import { useAuth } from "context/AuthContext";
import { useInvalidateQuery } from "hooks/use-invalidate-query";
import { getSessionUser } from "lib/auth";
import { classNames } from "lib/classNames";
import { getTranslations } from "lib/getTranslation";
import useFetch from "lib/useFetch";
import { requestAll } from "lib/utils";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";

interface BleeterProfilePageProps {
  data: GetBleeterProfileByHandleData;
}

export default function BleeterProfilePage(props: BleeterProfilePageProps) {
  const { openModal } = useModal();
  const { user } = useAuth();
  const { execute, state } = useFetch();
  const followersData = useFollowers({ profileHandle: props.data.handle });
  const followingData = useFollowing({ profileHandle: props.data.handle });
  const t = useTranslations("Bleeter");
  const router = useRouter();
  const { invalidateQuery: invalidateFollowers } = useInvalidateQuery(["bleeter-followers"]);
  const { invalidateQuery: invalidateFollowing } = useInvalidateQuery(["bleeter-following"]);

  async function handleFollow() {
    const { json } = await execute({
      path: `/bleeter/profiles/${props.data.handle}/follow`,
      method: "POST",
    });

    if (json) {
      router.replace(router.asPath);
      invalidateFollowers();
      invalidateFollowing();
    }
  }

  const followingCount = followingData.isInitialLoading
    ? props.data.followingCount
    : followingData.following?.length ?? props.data.followingCount;

  const followersCount = followersData.isInitialLoading
    ? props.data.followersCount
    : followersData.followers?.length ?? props.data.followersCount;

  return (
    <Layout className="dark:text-white">
      <header className="flex flex-col md:flex-row justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Title renderLayoutTitle={false}>
              {props.data.name} - {t("bleeter")}
            </Title>
            <h1 className="text-3xl font-bold">{props.data.name}</h1>

            {user?.id === props.data.userId ? (
              <Button className="text-sm" size="xs">
                {t("editProfile")}
              </Button>
            ) : (
              <Button
                onPress={handleFollow}
                className="inline-flex gap-2 items-center text-sm"
                size="xs"
              >
                {state === "loading" ? <Loader /> : null}
                {props.data.isFollowingThisProfile ? t("unfollow") : t("follow")}
              </Button>
            )}
          </div>
          <h2 className="text-xl font-light text-neutral-800 dark:text-gray-300">
            @{props.data.handle}
          </h2>
          <p className="my-2 text-neutral-700 dark:text-gray-400">{props.data.bio}</p>
        </div>

        <ul className="flex gap-3">
          <li className="text-center">
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-gray-300">
              {t("posts")}
            </h3>
            <p>{props.data.postsCount}</p>
          </li>
          <li
            onClick={() => followersCount && openModal(ModalIds.Followers)}
            className={classNames("text-center", followersCount && "cursor-pointer")}
          >
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-gray-300">
              {t("followers")}
            </h3>
            <p>{followersCount}</p>
          </li>
          <li
            onClick={() => followingCount && openModal(ModalIds.Following)}
            className={classNames("text-center", followingCount && "cursor-pointer")}
          >
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-gray-300">
              {t("following")}
            </h3>
            <p>{followingCount}</p>
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
