import { TabsContent } from "components/shared/TabList";
import { Button } from "components/Button";
import { useAuth } from "context/AuthContext";
import { useTranslations } from "use-intl";
import { findUrl } from "lib/fetch";
import useFetch from "lib/useFetch";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";

export function ConnectionsTab() {
  const { user, setUser } = useAuth();
  const t = useTranslations("Account");
  const { state, execute } = useFetch();
  const { ALLOW_REGULAR_LOGIN } = useFeatureEnabled();

  function handleConnectClick() {
    const url = findUrl();

    // append date so browsers don't cache this URL.
    const fullUrl = `${url}/auth/discord?v=${new Date().toISOString()}`;
    window.location.href = fullUrl;
  }

  async function handleUnlink() {
    const { json } = await execute("/auth/discord", { method: "DELETE" });

    if (json && user) {
      setUser({ ...user, discordId: null });
    }
  }

  return (
    <TabsContent aria-label={t("connections")} value="connections">
      <h3 className="text-2xl font-semibold">{t("connections")}</h3>
      <div className="mt-5">
        {user?.discordId ? (
          <>
            <Button
              onClick={handleUnlink}
              disabled={!ALLOW_REGULAR_LOGIN || state === "loading"}
              variant="danger"
            >
              {state === "loading" ? t("disconnecting") : t("disconnectDiscord")}
            </Button>
            <p className="mt-2 text-base">
              {ALLOW_REGULAR_LOGIN ? t("disconnectText") : t("disabledDisconnectText")}
            </p>
          </>
        ) : (
          <>
            <Button onClick={handleConnectClick}>{t("connectDiscord")}</Button>
            <p className="mt-2 text-base">{t("connectText")}</p>
          </>
        )}
      </div>
    </TabsContent>
  );
}
