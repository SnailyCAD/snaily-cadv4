import Head from "next/head";
import { Layout } from "components/Layout";
import { Tab } from "@headlessui/react";
import type { GetServerSideProps } from "next";
import { useTranslations } from "use-intl";

import { useAuth } from "src/context/AuthContext";
import { TabsContainer } from "components/tabs/TabsContainer";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import dynamic from "next/dynamic";

const AccountSettingsTab = dynamic(async () => {
  return (await import("components/account/AccountSettingsTab")).AccountSettingsTab;
});

const AppearanceTab = dynamic(async () => {
  return (await import("components/account/AppearanceTab")).AppearanceTab;
});

export default function Account() {
  const { user } = useAuth();
  const t = useTranslations("Account");

  const TABS_TITLES = [t("accountInfo"), t("accountSettings"), t("appearanceSettings")];

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <Head>
        <title>{t("account")} - SnailyCAD</title>
      </Head>

      <div className="w-full flex justify-center">
        <div className="max-w-4xl w-full">
          <TabsContainer tabs={TABS_TITLES}>
            <Tab.Panels className="mt-2">
              <Tab.Panel className="bg-white rounded-xl p-3">
                <h3 className="text-2xl font-semibold">{t("accountInfo")}</h3>
                <div className="mt-2">
                  {Object.entries(user)
                    .filter(([k]) => k !== "cad")
                    .map(([key, value]) => {
                      return (
                        <p key={key}>
                          <span className="capitalize font-semibold">{key}: </span> {String(value)}
                        </p>
                      );
                    })}
                </div>
              </Tab.Panel>
              <AccountSettingsTab />
              <AppearanceTab />
            </Tab.Panels>
          </TabsContainer>
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, req }) => {
  return {
    props: {
      session: await getSessionUser(req.headers),
      messages: {
        ...(await getTranslations(["account", "common"], locale)),
      },
    },
  };
};
