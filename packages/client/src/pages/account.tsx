import * as React from "react";
import { Layout } from "components/Layout";
import { TabsContent, TabList } from "components/shared/TabList";
import type { GetServerSideProps } from "next";
import { useTranslations } from "next-intl";

import { useAuth } from "src/context/AuthContext";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useMounted } from "@casper124578/useful";
import { Title } from "components/shared/Title";
import { toastError } from "lib/error";

const AccountSettingsTab = dynamic(async () => {
  return (await import("components/account/AccountSettingsTab")).AccountSettingsTab;
});

const AppearanceTab = dynamic(async () => {
  return (await import("components/account/AppearanceTab")).AppearanceTab;
});

const ConnectionsTab = dynamic(async () => {
  return (await import("components/account/ConnectionsTab")).ConnectionsTab;
});

export default function Account() {
  const mounted = useMounted();
  const { user } = useAuth();
  const t = useTranslations("Account");
  const router = useRouter();
  const { DISCORD_AUTH } = useFeatureEnabled();
  const errorT = useTranslations("Errors");

  const errors = {
    discordAccountAlreadyLinked: errorT("discordAccountAlreadyLinked"),
  };
  const error = errors[router.query.error as keyof typeof errors];

  React.useEffect(() => {
    if (error && mounted) {
      toastError({ message: error });
    }
  }, [error, mounted]);

  const tab = router.query.tab;
  const discordValue = DISCORD_AUTH ? (tab === "discord" ? "connections" : undefined) : undefined;

  const TABS_TITLES = [
    { name: t("accountInfo"), value: "accountInfo" },
    { name: t("accountSettings"), value: "accountSettings" },
    { name: t("appearanceSettings"), value: "appearanceSettings" },
  ];

  if (DISCORD_AUTH) {
    TABS_TITLES[3] = { name: t("connections"), value: "connections" };
  }

  if (!user) {
    return null;
  }

  return (
    <Layout className="dark:text-white">
      <Title>{t("account")}</Title>

      <div className="flex justify-center w-full">
        <div className="w-full max-w-4xl">
          <TabList defaultValue={discordValue} tabs={TABS_TITLES}>
            <TabsContent aria-label={t("accountInfo")} value="accountInfo">
              <h3 className="text-2xl font-semibold">{t("accountInfo")}</h3>
              <div className="mt-2">
                {Object.entries(user)
                  .filter(([k]) => k !== "cad")
                  .map(([key, value]) => {
                    return (
                      <p key={key}>
                        <span className="font-semibold capitalize">{key}: </span> {String(value)}
                      </p>
                    );
                  })}
              </div>
            </TabsContent>
            <AccountSettingsTab />
            <AppearanceTab />
            {DISCORD_AUTH ? <ConnectionsTab /> : null}
          </TabList>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  return {
    props: {
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["account", "common"], locale)),
      },
    },
  };
};
