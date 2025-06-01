import * as React from "react";
import { Layout } from "components/Layout";
import { TabList } from "@snailycad/ui";
import type { GetServerSideProps } from "next";
import { useTranslations } from "next-intl";
import { useAuth } from "context/AuthContext";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useMounted } from "@casperiv/useful";
import { Title } from "components/shared/Title";
import { toastMessage } from "lib/toastMessage";
import { canUseThirdPartyConnections } from "lib/utils";
import { getAvailableSounds, type Sounds } from "lib/server/getAvailableSounds.server";
import { AccountInfoTab } from "components/account/account-info-tab";

const AccountSettingsTab = dynamic(
  async () => (await import("components/account/settings/account-settings-tab")).AccountSettingsTab,
  { ssr: false },
);

const AppearanceTab = dynamic(
  async () => (await import("components/account/appearance-tab")).AppearanceTab,
  { ssr: false },
);

const ConnectionsTab = dynamic(
  async () => (await import("components/account/user-connections-tab")).ConnectionsTab,
  { ssr: false },
);

const UserApiTokenTab = dynamic(
  async () => (await import("components/account/user-api-token-tab")).UserApiTokenTab,
  { ssr: false },
);

interface Props {
  availableSounds: Record<Sounds, boolean>;
}

export default function Account({ availableSounds }: Props) {
  const mounted = useMounted();
  const { user } = useAuth();
  const t = useTranslations("Account");
  const router = useRouter();
  const { DISCORD_AUTH, STEAM_OAUTH } = useFeatureEnabled();
  const errorT = useTranslations("Errors");
  const showConnectionsTab = (DISCORD_AUTH || STEAM_OAUTH) && canUseThirdPartyConnections();

  const errors = {
    discordAccountAlreadyLinked: errorT("discordAccountAlreadyLinked"),
  };
  const error = errors[router.query.error as keyof typeof errors];

  React.useEffect(() => {
    if (error && mounted) {
      toastMessage({ message: error });
    }
  }, [error, mounted]);

  const tab = router.query.tab;
  const discordValue = DISCORD_AUTH ? (tab === "discord" ? "connections" : undefined) : undefined;

  const TABS_TITLES = [
    { name: t("accountInfo"), value: "accountInfo" },
    { name: t("accountSettings"), value: "accountSettings" },
    { name: t("appearanceSettings"), value: "appearanceSettings" },
    { name: t("userApiToken"), value: "userApiToken" },
  ];

  if (showConnectionsTab) {
    TABS_TITLES[4] = { name: t("connections"), value: "connections" };
  }

  if (!user) {
    return null;
  }

  return (
    <Layout className="dark:text-white">
      <Title renderLayoutTitle={false}>{t("account")}</Title>

      <div className="flex justify-center w-full">
        <div className="w-full max-w-4xl">
          <TabList defaultValue={discordValue} tabs={TABS_TITLES}>
            <AccountInfoTab />
            <AccountSettingsTab />
            <AppearanceTab availableSounds={availableSounds} />
            <UserApiTokenTab />
            {showConnectionsTab ? <ConnectionsTab /> : null}
          </TabList>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  const availableSounds = await getAvailableSounds();
  const user = await getSessionUser(req);

  return {
    props: {
      session: user,
      availableSounds,
      messages: {
        ...(await getTranslations(
          ["account", "cad-settings", "auth", "common", "admin"],
          user?.locale ?? locale,
        )),
      },
    },
  };
};
