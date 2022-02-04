import * as React from "react";
import useFetch from "lib/useFetch";
import { useModal } from "context/ModalContext";
import type { User } from "@snailycad/types";
import { ModalIds } from "types/ModalIds";
import { Modal } from "components/modal/Modal";
import { Loader } from "components/Loader";
import { useTranslations } from "use-intl";

interface Props {
  user: User;
}

export function GiveTempPasswordModal({ user }: Props) {
  const { state, execute } = useFetch();
  const { isOpen, closeModal } = useModal();
  const t = useTranslations("Management");

  const [result, setResult] = React.useState<string | null>(null);

  async function fetchNewPassword() {
    const { json } = await execute(`/admin/manage/users/temp-password/${user.id}`, {
      method: "POST",
    });

    if (json && typeof json === "string") {
      setResult(json);
    }
  }

  React.useEffect(() => {
    if (!result && isOpen(ModalIds.GiveTempPassword)) {
      fetchNewPassword();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, result]);

  React.useEffect(() => {
    if (result && !isOpen(ModalIds.GiveTempPassword)) {
      setTimeout(() => setResult(null), 90);
    }
  }, [isOpen, result]);

  React.useEffect(() => {
    if (!result && isOpen(ModalIds.GiveTempPassword)) {
      fetchNewPassword();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, result]);

  return (
    <Modal
      className="w-[600px]"
      title={t("giveTempPassword")}
      onClose={() => closeModal(ModalIds.GiveTempPassword)}
      isOpen={isOpen(ModalIds.GiveTempPassword)}
    >
      {state === "loading" ? (
        <Loader />
      ) : result ? (
        <p className="mt-4">
          <span className="font-semibold">The following password</span>{" "}
          <span>&quot;{result}&quot;</span> will allow
          <span className="font-semibold"> {user.username}</span> to login.
        </p>
      ) : (
        <p>Could not fetch new password.</p>
      )}
    </Modal>
  );
}
