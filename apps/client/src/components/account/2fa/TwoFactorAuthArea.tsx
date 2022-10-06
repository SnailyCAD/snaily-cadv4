import { useTranslations } from "next-intl";
import { useAuth } from "context/AuthContext";
import { Button } from "@snailycad/ui";
import { ModalIds } from "types/ModalIds";
import { useModal } from "state/modalState";

export function TwoFactorAuthArea() {
  const { openModal } = useModal();
  const t = useTranslations("Account");
  const { user } = useAuth();
  const is2faEnabled = user?.twoFactorEnabled;

  return (
    <section className="mt-7">
      <h2 className="text-2xl font-semibold">{t("2fa")}</h2>

      <Button
        className="mt-3"
        variant={is2faEnabled ? "danger" : "default"}
        type="button"
        onPress={() => openModal(ModalIds.Manage2FA, !!is2faEnabled)}
      >
        {is2faEnabled ? t("disable2FA") : t("enable2FA")}
      </Button>
    </section>
  );
}
