import { Loader, Button } from "@snailycad/ui";
import useFetch from "lib/useFetch";
import { useRouter } from "next/router";
import { ModalIds } from "types/ModalIds";
import { useModal } from "state/modalState";
import { AlertModal } from "components/modal/AlertModal";
import { GiveTempPasswordModal } from "./modals/give-temp-password-modal";
import { useTranslations } from "use-intl";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import type {
  DeleteManageUserRevokeApiTokenData,
  DeleteManageUsersData,
  GetManageUserByIdData,
} from "@snailycad/types/api";

interface Props {
  user: GetManageUserByIdData;
  setUser: React.Dispatch<React.SetStateAction<GetManageUserByIdData>>;
}

export function DangerZone({ user, setUser }: Props) {
  const { state, execute } = useFetch();
  const router = useRouter();
  const { openModal, closeModal } = useModal();
  const t = useTranslations("Management");
  const { USER_API_TOKENS } = useFeatureEnabled();

  const formDisabled = user.rank === "OWNER";

  async function handleDisable2FA() {
    if (formDisabled) return;

    const { json } = await execute<DeleteManageUserRevokeApiTokenData>({
      path: `/admin/manage/users/${user.id}/2fa`,
      method: "DELETE",
    });

    if (json) {
      closeModal(ModalIds.AlertDisableUser2FA);
      setUser({ ...user, twoFactorEnabled: false });
    }
  }

  async function handleDelete() {
    if (formDisabled) return;

    const { json } = await execute<DeleteManageUsersData>({
      path: `/admin/manage/users/${user.id}`,
      method: "DELETE",
    });

    if (json) {
      router.push("/admin/manage/users");
    }
  }

  async function handleRevoke() {
    if (formDisabled) return;

    const { json } = await execute<DeleteManageUserRevokeApiTokenData>({
      path: `/admin/manage/users/${user.id}/api-token`,
      method: "DELETE",
    });

    if (json) {
      closeModal(ModalIds.AlertRevokePersonalApiToken);
      setUser({ ...user, apiToken: null, apiTokenId: null });
    }
  }

  return (
    <div className="p-4 mt-5 rounded-md card dark:border">
      <h1 className="text-2xl font-semibold">Danger Zone</h1>

      <div className="flex mt-3">
        <Button
          variant="danger"
          className="flex items-center"
          disabled={state === "loading"}
          onPress={() => openModal(ModalIds.AlertDeleteUser)}
        >
          {state === "loading" ? <Loader className="mr-3" /> : null}
          Delete User
        </Button>

        <Button
          variant="danger"
          className="flex items-center ml-2"
          disabled={state === "loading"}
          onPress={() => openModal(ModalIds.AlertGiveTempPassword)}
        >
          {state === "loading" ? <Loader className="mr-3" /> : null}
          Temporary Password
        </Button>

        {user.twoFactorEnabled ? (
          <Button
            variant="danger"
            className="flex items-center ml-2"
            disabled={state === "loading"}
            onPress={() => openModal(ModalIds.AlertDisableUser2FA)}
          >
            {state === "loading" ? <Loader className="mr-3" /> : null}
            Disable Two Factor Authentication
          </Button>
        ) : null}

        {USER_API_TOKENS && user.apiTokenId ? (
          <Button
            variant="danger"
            className="flex items-center ml-2"
            disabled={state === "loading"}
            onPress={() => openModal(ModalIds.AlertRevokePersonalApiToken)}
          >
            {state === "loading" ? <Loader className="mr-3" /> : null}
            Revoke Personal API Token
          </Button>
        ) : null}
      </div>

      <AlertModal
        onDeleteClick={handleDelete}
        title="Delete User"
        description={`Are you sure you want to delete ${user.username}'s account? All their data will be lost.`}
        id={ModalIds.AlertDeleteUser}
      />

      <AlertModal
        onDeleteClick={() => {
          closeModal(ModalIds.AlertGiveTempPassword);
          openModal(ModalIds.GiveTempPassword);
        }}
        title={t("giveTempPassword")}
        description={`Are you sure you want to give ${user.username} a temporary password? They will not be able to log in to their account with their previous password. They will only be able to login with the password provided in the next step.`}
        id={ModalIds.AlertGiveTempPassword}
        deleteText={t("continue")}
      />

      <AlertModal
        onDeleteClick={handleRevoke}
        title="Revoke Personal API token"
        description={`Are you sure you want to revoke ${user.username}'s personal API Token? They will not be able to use this API token anymore. They are able to re-generate a new one later. You can remove their 'Use Personal Api Token' permissions via 'Manage Permissions'`}
        id={ModalIds.AlertRevokePersonalApiToken}
        deleteText="Revoke"
      />

      <AlertModal
        onDeleteClick={handleDisable2FA}
        title="Disable Two Factor Authentication"
        description={`Are you sure you want to disable ${user.username}'s Two Factor Authentication? They can re-enable it again in their settings.`}
        id={ModalIds.AlertDisableUser2FA}
        deleteText="Disable"
      />

      <GiveTempPasswordModal user={user} />
    </div>
  );
}
