import { Button } from "components/Button";
import { Loader } from "components/Loader";
import useFetch from "lib/useFetch";
import { User } from "types/prisma";
import { useRouter } from "next/router";
import { ModalIds } from "types/ModalIds";
import { useModal } from "context/ModalContext";
import { AlertModal } from "components/modal/AlertModal";

interface Props {
  user: User;
}

export const DangerZone = ({ user }: Props) => {
  const { state, execute } = useFetch();
  const router = useRouter();
  const { openModal } = useModal();

  const formDisabled = user.rank === "OWNER";

  async function handleDelete() {
    if (formDisabled) return;

    const { json } = await execute(`/admin/manage/users/${user.id}`, {
      method: "DELETE",
    });

    if (json) {
      router.push("/admin/manage/users");
    }
  }

  return (
    <div className="bg-gray-200 mt-10 rounded-md p-3">
      <h1 className="text-2xl font-semibold">Danger Zone</h1>

      <div className="mt-1">
        <Button
          variant="danger"
          className="flex items-center mt-2"
          disabled={state === "loading"}
          onClick={() => openModal(ModalIds.AlertDeleteUser)}
        >
          {state === "loading" ? <Loader className="mr-3" /> : null}
          Delete User
        </Button>
      </div>

      <AlertModal
        onDeleteClick={handleDelete}
        title="Delete User"
        description={`Are you sure you want to delete ${user.username}'s account? All their data will be lost.`}
        id={ModalIds.AlertDeleteUser}
      />
    </div>
  );
};
