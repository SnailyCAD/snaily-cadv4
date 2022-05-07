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
  const { ALLOW_REGULAR_LOGIN, STEAM_OAUTH, DISCORD_AUTH } = useFeatureEnabled();

  function handleConnectClick(type: "discord" | "steam") {
    const url = findUrl();

    // append date so browsers don't cache this URL.
    const fullUrl = `${url}/auth/${type}?v=${new Date().toISOString()}`;
    window.location.href = fullUrl;
  }

  async function handleUnlink(type: "discord" | "steam") {
    const { json } = await execute(`/auth/${type}`, { method: "DELETE" });

    if (json && user) {
      const key = type === "discord" ? "discordId" : "steamId";
      setUser({ ...user, [key]: null });
    }
  }

  console.log({ STEAM_OAUTH });

  return (
    <TabsContent aria-label={t("connections")} value="connections">
      <h3 className="text-2xl font-semibold">{t("connections")}</h3>
      <div className="mt-5">
        {DISCORD_AUTH ? (
          <section>
            <h4 className="my-2 font-semibold text-xl">{t("discord")}</h4>
            {user?.discordId ? (
              <>
                <Button
                  onClick={() => handleUnlink("discord")}
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
                <Button onClick={() => handleConnectClick("discord")}>{t("connectDiscord")}</Button>
                <p className="mt-2 text-base">{t("connectText")}</p>
              </>
            )}
          </section>
        ) : null}

        {STEAM_OAUTH ? (
          <section className="mt-5">
            <h4 className="my-2 font-semibold text-xl">{t("steam")}</h4>
            {user?.steamId ? (
              <>
                <Button
                  onClick={() => handleUnlink("steam")}
                  disabled={!ALLOW_REGULAR_LOGIN || state === "loading"}
                  variant="danger"
                >
                  {state === "loading" ? t("disconnecting") : t("disconnectSteam")}
                </Button>
                <p className="mt-2 text-base">
                  {ALLOW_REGULAR_LOGIN ? t("disconnectSteamText") : t("disabledDisconnectText")}
                </p>
              </>
            ) : (
              <>
                <Button onClick={() => handleConnectClick("steam")}>{t("connectSteam")}</Button>
                <p className="mt-2 text-base">{t("connectSteamText")}</p>
              </>
            )}
          </section>
        ) : null}
      </div>
    </TabsContent>
  );
}
