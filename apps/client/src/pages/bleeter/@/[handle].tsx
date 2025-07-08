import { defaultPermissions } from "@snailycad/permissions";
import type { GetBleeterProfileByHandleData } from "@snailycad/types/api";
import { Button, Loader } from "@snailycad/ui";
import { Layout } from "components/Layout";
import { BleeterPostsList } from "components/bleeter/list/posts-list";
import { ManageBleetModal } from "components/bleeter/manage-bleet-modal";
import { EditBleeterProfileModal } from "components/bleeter/modals/edit-profile-modal";
import {
  FollowersFollowingModal,
  useFollowers,
  useFollowing,
} from "components/bleeter/modals/followers-following-modal";
import { Title } from "components/shared/Title";
import { useAuth } from "context/AuthContext";
import { useInvalidateQuery } from "hooks/use-invalidate-query";
import { usePermission } from "hooks/usePermission";
import { getSessionUser } from "lib/auth";
import { classNames } from "lib/classNames";
import { getTranslations } from "lib/getTranslation";
import useFetch from "lib/useFetch";
import { requestAll } from "lib/utils";
import type { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { PatchCheckFill } from "react-bootstrap-icons";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";

interface BleeterProfilePageProps {
  data: GetBleeterProfileByHandleData;
}

export default function BleeterProfilePage(props: BleeterProfilePageProps) {
  const modalState = useModal();
  const { user } = useAuth();
  const { execute, state } = useFetch();
  const followersData = useFollowers({ profileHandle: props.data.handle });
  const followingData = useFollowing({ profileHandle: props.data.handle });
  const t = useTranslations("Bleeter");
  const router = useRouter();
  const { invalidateQuery: invalidateFollowers } = useInvalidateQuery(["bleeter-followers"]);
  const { invalidateQuery: invalidateFollowing } = useInvalidateQuery(["bleeter-following"]);
  const { hasPermissions } = usePermission();
  const hasAdminPermissions = hasPermissions(defaultPermissions.defaultManagementPermissions);

  async function handleFollow() {
    const { json } = await execute({
      path: `/bleeter/profiles/${props.data.handle}/follow`,
      method: "POST",
    });

    if (json) {
      router.replace(router.asPath);
      await invalidateFollowing();
      await invalidateFollowers();
    }
  }

  async function handleProfileVerification() {
    const { json } = await execute({
      path: `/bleeter/profiles/${props.data.handle}/verify`,
      method: "POST",
    });

    if (json) {
      router.replace(router.asPath);
    }
  }

  const followingCount = followingData.isInitialLoading
    ? props.data.followingCount
    : (followingData.following?.length ?? props.data.followingCount);

  const followersCount = followersData.isInitialLoading
    ? props.data.followersCount
    : (followersData.followers?.length ?? props.data.followersCount);

  return (
    <Layout className="dark:text-white">
      <header className="flex flex-col md:flex-row justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Title renderLayoutTitle={false}>
              {props.data.name} - {t("bleeter")}
            </Title>
            <h1 className="text-3xl font-bold flex gap-2 items-center">
              {props.data.name}
              {props.data.isVerified ? (
                <PatchCheckFill className="inline text-blue-500 text-xl mt-1" />
              ) : null}
            </h1>

            {user?.id === props.data.userId ? (
              <>
                <Button
                  onPress={() => modalState.openModal(ModalIds.ManageBleeterProfile)}
                  className="text-sm"
                  size="xs"
                >
                  {t("editProfile")}
                </Button>
                <Button
                  onPress={() => modalState.openModal(ModalIds.ManageBleetModal)}
                  className="inline-flex gap-2 items-center text-sm"
                  size="xs"
                >
                  {t("createBleet")}
                </Button>
              </>
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
            {hasAdminPermissions ? (
              props.data.isVerified ? (
                <Button onPress={() => handleProfileVerification()} className="text-sm" size="xs">
                  {t("unVerifyProfile")}
                </Button>
              ) : (
                <Button onPress={() => handleProfileVerification()} className="text-sm" size="xs">
                  {t("verifyProfile")}
                </Button>
              )
            ) : null}
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
            role="button"
            onClick={() => followersCount && modalState.openModal(ModalIds.Followers)}
            className={classNames("text-center", followersCount && "cursor-pointer")}
          >
            <h3 className="text-lg font-semibold text-neutral-800 dark:text-gray-300">
              {t("followers")}
            </h3>
            <p>{followersCount}</p>
          </li>
          <li
            role="button"
            onClick={() => followingCount && modalState.openModal(ModalIds.Following)}
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
      <ManageBleetModal onCreate={(post) => router.push(`/bleeter/${post.id}`)} post={null} />

      {user?.id === props.data.userId ? <EditBleeterProfileModal profile={props.data} /> : null}
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
