import { useTranslations } from "use-intl";

import type { GetServerSideProps } from "next";
import { getTranslations } from "lib/getTranslation";
import { Button } from "@snailycad/ui";
import { getSessionUser } from "lib/auth";
import { useAuth } from "context/AuthContext";
import { Title } from "components/shared/Title";
import { VersionDisplay } from "components/shared/VersionDisplay";
import { WhitelistStatus } from "@snailycad/types";
import { canUseThirdPartyConnections } from "lib/utils";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { Discord, Steam } from "react-bootstrap-icons";
import { getAPIUrl } from "@snailycad/utils/api-url";
import { useRouter } from "next/router";

export default function AccountPendingPage() {
  const { user, cad } = useAuth();

  const router = useRouter();
  const t = useTranslations("Auth");
  const { DISCORD_AUTH, STEAM_OAUTH } = useFeatureEnabled();

  if (user?.whitelistStatus !== WhitelistStatus.PENDING) {
    return <main className="flex justify-center pt-20">This account is not pending access.</main>;
  }

  const rawSuccessMessage = router.query.success as string | undefined;
  const successMessages = {
    discord: t("discordSyncSuccess"),
    steam: t("steamSyncSuccess"),
  } as Record<string, string>;
  const successMessage = rawSuccessMessage && successMessages[rawSuccessMessage];

  const useThirdPartyConnectionsAbility = canUseThirdPartyConnections();
  const showSteamOAuth = STEAM_OAUTH && useThirdPartyConnectionsAbility;
  const showDiscordOAuth = DISCORD_AUTH && useThirdPartyConnectionsAbility;

  function handleDiscordLogin() {
    const url = getAPIUrl();

    const fullUrl = `${url}/auth/discord?syncOnly`;
    window.location.href = fullUrl;
  }

  function handleSteamLogin() {
    const url = getAPIUrl();

    const fullUrl = `${url}/auth/steam?syncOnly`;
    window.location.href = fullUrl;
  }

  return (
    <>
      <Title renderLayoutTitle={false}>{t("accountPending")}</Title>

      <main className="flex flex-col items-center justify-center pt-20">
        <div className="w-full max-w-md p-6 bg-gray-100 rounded-lg shadow-md dark:bg-primary dark:border dark:border-secondary">
          {successMessage ? (
            <div
              role="alert"
              className="bg-green-500/80 text-black w-full py-1.5 px-3 my-3 rounded-md"
            >
              {successMessage}
            </div>
          ) : null}

          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            {t("accountPending")}
          </h1>

          <p className="my-3 text-base text-gray-800 dark:text-white">{t("accountPendingText")}</p>

          <div className="my-5 flex items-center gap-2">
            <span className="h-[2px] bg-secondary w-full rounded-md" />
          </div>

          {showDiscordOAuth ? (
            <Button
              type="button"
              onPress={handleDiscordLogin}
              className="flex items-center justify-center gap-3 w-full"
            >
              <Discord />
              {t("syncDiscord")}
            </Button>
          ) : null}

          {showSteamOAuth ? (
            <Button
              type="button"
              onPress={handleSteamLogin}
              className="flex items-center justify-center gap-3 w-full mt-2"
            >
              <Steam />
              {t("syncSteam")}
            </Button>
          ) : null}
        </div>
        <VersionDisplay cad={cad} />

        <a
          rel="noreferrer"
          target="_blank"
          className="mt-3 md:mt-0 relative md:absolute md:bottom-10 md:left-1/2 md:-translate-x-1/2 underline text-lg transition-colors text-neutral-700 hover:text-neutral-900 dark:text-gray-400 dark:hover:text-white mx-2 block cursor-pointer z-50"
          href="https://snailycad.org"
        >
          SnailyCAD
        </a>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const user = await getSessionUser(req);
  return {
    props: {
      session: user,
      messages: await getTranslations(["auth"], user?.locale ?? locale),
    },
  };
};
