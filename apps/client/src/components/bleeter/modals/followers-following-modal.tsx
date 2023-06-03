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

interface FollowersFollowingModalProps {
  type: "following" | "followers";
  profileHandle: string;
}

export function FollowersFollowingModal(props: FollowersFollowingModalProps) {
  const { isOpen, closeModal } = useModal();
  const { execute } = useFetch();
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
      title={props.type === "followers" ? "Followers" : "Following"}
      isOpen={isOpen(modalId)}
    >
      {isLoading || !data ? (
        <Loader />
      ) : data.length <= 0 ? (
        <p>This user does not have any followers</p>
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
                <Link href={`/bleeter/@/${profile?.handle}`}>
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
