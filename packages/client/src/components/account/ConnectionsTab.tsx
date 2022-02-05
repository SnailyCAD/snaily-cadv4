import { TabsContent } from "components/shared/TabList";
import { Button } from "components/Button";
import { useAuth } from "context/AuthContext";
import { useTranslations } from "use-intl";
import { findUrl } from "lib/fetch";
import useFetch from "lib/useFetch";

export function ConnectionsTab() {
  const { user, setUser } = useAuth();
  const t = useTranslations("Account");
  const { state, execute } = useFetch();

  function handleConnectClick() {
    const url = findUrl();

    const fullUrl = `${url}/auth/discord`;
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
            <Button onClick={handleUnlink} disabled={state === "loading"} variant="danger">
              {state === "loading" ? t("disconnecting") : t("disconnectDiscord")}
            </Button>
            <p className="mt-2 text-base">{t("disconnectText")}</p>
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
