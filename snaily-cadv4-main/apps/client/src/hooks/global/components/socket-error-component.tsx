import { Alert } from "@snailycad/ui";
import { useTranslations } from "use-intl";

export function SocketErrorComponent() {
  const t = useTranslations("Errors");

  return (
    <Alert className="my-2" title={t("socketError")} message={t("socketErrorInfo")} type="error" />
  );
}
