import {
  GetBleeterProfileFollowersData,
  GetBleeterProfileFollowingData,
} from "@snailycad/types/api";
import { Loader } from "@snailycad/ui";
import { useQuery } from "@tanstack/react-query";
import { Modal } from "components/modal/Modal";
import useFetch from "lib/useFetch";
import Link from "next/link";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";

interface Options {
  profileHandle: string;
}

export function useFollowers(options: Options) {
  const { execute } = useFetch();
  const { data, isInitialLoading } = useQuery({
    queryKey: ["bleeter-followers", options.profileHandle],
    queryFn: async () => {
      const { json } = await execute<GetBleeterProfileFollowersData>({
        path: `/bleeter/profiles/${options.profileHandle}/followers`,
      });

      return json;
    },
  });

  return { followers: data, isInitialLoading };
}

export function useFollowing(options: Options) {
  const { execute } = useFetch();
  const { data, isInitialLoading } = useQuery({
    queryKey: ["bleeter-following", options.profileHandle],
    queryFn: async () => {
      const { json } = await execute<GetBleeterProfileFollowingData>({
        path: `/bleeter/profiles/${options.profileHandle}/following`,
      });

      return json;
    },
  });

  return { following: data, isInitialLoading };
}

interface FollowersFollowingModalProps {
  type: "following" | "followers";
  profileHandle: string;
}

export function FollowersFollowingModal(props: FollowersFollowingModalProps) {
  const { isOpen, closeModal } = useModal();
  const { execute } = useFetch();
  const t = useTranslations("Bleeter");
  const modalId = props.type === "followers" ? ModalIds.Followers : ModalIds.Following;

  const { data, isLoading } = useQuery({
    queryKey: [props.type, props.profileHandle],
    queryFn: async () => {
      const { json } = await execute<
        GetBleeterProfileFollowersData | GetBleeterProfileFollowingData
      >({
        path: `/bleeter/profiles/${props.profileHandle}/${props.type}`,
      });

      return json;
    },
  });

  return (
    <Modal
      className="w-[600px]"
      onClose={() => closeModal(modalId)}
      title={t(props.type)}
      isOpen={isOpen(modalId)}
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
                  onClick={() => closeModal(modalId)}
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
