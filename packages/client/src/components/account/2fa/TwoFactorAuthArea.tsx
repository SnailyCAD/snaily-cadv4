import { useTranslations } from "next-intl";
import { useAuth } from "context/AuthContext";
import { Button } from "components/Button";
import { ModalIds } from "types/ModalIds";
import { useModal } from "context/ModalContext";

export function TwoFactorAuthArea() {
  const { openModal } = useModal();
  const t = useTranslations("Account");
  const { user } = useAuth();
  const is2faEnabled = user?.twoFactorEnabled;

  return (
    <section className="mt-5">
      <h3 className="text-2xl font-semibold">{t("2fa")}</h3>

      <Button
        className="mt-3"
        variant={is2faEnabled ? "danger" : "default"}
        type="button"
        onClick={() => openModal(ModalIds.Manage2FA, !!is2faEnabled)}
      >
        {is2faEnabled ? t("disable2FA") : t("enable2FA")}
      </Button>
    </section>
  );
}
