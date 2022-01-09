import * as React from "react";
import { Layout } from "components/Layout";
import { Tab } from "@headlessui/react";
import type { GetServerSideProps } from "next";
import { useTranslations } from "use-intl";

import { useAuth } from "src/context/AuthContext";
import { TabList } from "components/shared/TabList";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import toast from "react-hot-toast";
import { useMounted } from "@casper124578/useful";
import { Title } from "components/shared/Title";

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
      toast.error(error);
    }
  }, [error, mounted]);

  const tab = router.query.tab;
  const discordIndex = DISCORD_AUTH ? (tab === "discord" ? 3 : undefined) : undefined;

  const TABS_TITLES = [t("accountInfo"), t("accountSettings"), t("appearanceSettings")];

  if (DISCORD_AUTH) {
    TABS_TITLES[3] = t("connections");
  }

  if (!user) {
    return null;
  }

  return (
    <Layout className="dark:text-white">
      <Title>{t("account")}</Title>

      <div className="flex justify-center w-full">
        <div className="w-full max-w-4xl">
          <TabList defaultIndex={discordIndex} tabs={TABS_TITLES}>
            <Tab.Panels className="mt-2 dark:text-white">
              <Tab.Panel>
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
              </Tab.Panel>
              <AccountSettingsTab />
              <AppearanceTab />
              {DISCORD_AUTH ? <ConnectionsTab /> : null}
            </Tab.Panels>
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
