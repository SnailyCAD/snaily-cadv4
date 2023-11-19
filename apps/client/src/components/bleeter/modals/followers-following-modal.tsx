import type {
  GetBleeterProfileFollowersData,
  GetBleeterProfileFollowingData,
} from "@snailycad/types/api";
import { Loader } from "@snailycad/ui";
import { useQuery } from "@tanstack/react-query";
import { Modal } from "components/modal/Modal";
import useFetch from "lib/useFetch";
import Link from "next/link";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";

interface Options {
  profileHandle: string;
}

export function useFollowers(options: Options) {
  const { execute } = useFetch();
  const { data, isLoading, isInitialLoading } = useQuery({
    queryKey: ["bleeter-followers", options.profileHandle],
    queryFn: async () => {
      const { json } = await execute<GetBleeterProfileFollowersData>({
        path: `/bleeter/profiles/${options.profileHandle}/followers`,
      });

      return json;
    },
  });

  return { followers: data, isLoading, isInitialLoading };
}

export function useFollowing(options: Options) {
  const { execute } = useFetch();
  const { data, isLoading, isInitialLoading } = useQuery({
    queryKey: ["bleeter-following", options.profileHandle],
    queryFn: async () => {
      const { json } = await execute<GetBleeterProfileFollowingData>({
        path: `/bleeter/profiles/${options.profileHandle}/following`,
      });

      return json;
    },
  });

  return { following: data, isLoading, isInitialLoading };
}

interface FollowersFollowingModalProps {
  type: "following" | "followers";
  profileHandle: string;
}

export function FollowersFollowingModal(props: FollowersFollowingModalProps) {
  const modalState = useModal();
  const t = useTranslations("Bleeter");
  const modalId = props.type === "followers" ? ModalIds.Followers : ModalIds.Following;

  const followers = useFollowers({ profileHandle: props.profileHandle });
  const following = useFollowing({ profileHandle: props.profileHandle });
  const isLoading = followers.isInitialLoading || following.isInitialLoading;
  const data = props.type === "followers" ? followers.followers : following.following;

  return (
    <Modal
      className="w-[600px]"
      onClose={() => modalState.closeModal(modalId)}
      title={t(props.type)}
      isOpen={modalState.isOpen(modalId)}
    >
      {isLoading || !data ? (
        <Loader />
      ) : (
        <ul>
          {data?.map((follower) => {
            const profile =
              "followerProfile" in follower && props.type === "following"
                ? follower.followerProfile
                : "followingProfile" in follower && props.type === "followers"
                  ? follower.followingProfile
                  : null;

            return (
              <li key={profile?.handle}>
                <Link
                  className="hover:underline"
                  onClick={() => modalState.closeModal(modalId)}
                  href={`/bleeter/@/${profile?.handle}`}
                >
                  <h3>{profile?.name}</h3>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
