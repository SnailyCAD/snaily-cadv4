import * as React from "react";
import { AdminLayout } from "components/admin/AdminLayout";
import { useTranslations } from "use-intl";
import type { GetServerSideProps } from "next";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { TabList } from "components/shared/TabList";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import dynamic from "next/dynamic";
import { GeneralSettingsTab } from "components/admin/manage/cad-settings/general-settings-tab";

const Tabs = {
  CADFeaturesTab: dynamic(
    async () =>
      (await import("components/admin/manage/cad-settings/CADFeaturesTab")).CADFeaturesTab,
  ),
  MiscFeatures: dynamic(
    async () => (await import("components/admin/manage/cad-settings/MiscFeatures")).MiscFeatures,
  ),
  AutoSetUserPropertiesTab: dynamic(
    async () =>
      (await import("components/admin/manage/cad-settings/AutoSetUserPropertiesTab"))
        .AutoSetUserPropertiesTab,
  ),
  ApiTokenTab: dynamic(
    async () => (await import("components/admin/manage/cad-settings/ApiTokenTab")).ApiTokenTab,
  ),
  DiscordRolesTab: dynamic(
    async () =>
      (await import("components/admin/manage/cad-settings/discord-roles-tab")).DiscordRolesTab,
  ),
  DiscordWebhooksTab: dynamic(
    async () =>
      (await import("components/admin/manage/cad-settings/webhooks/discord-webhooks-tab"))
        .DiscordWebhooksTab,
  ),
};

export enum SettingsTabs {
  GeneralSettings = "GENERAL_SETTINGS",
  Features = "FEATURES",
  MiscSettings = "MISC_SETTINGS",
  AutoSetProperties = "AUTO_SET_PROPERTIES",
  APIToken = "API_TOKEN",
  DiscordRoles = "DISCORD_ROLES",
  DiscordWebhooks = "DISCORD_WEBHOOKS",
}

export default function CadSettings() {
  const t = useTranslations("Management");
  const [activeTab, setActiveTab] = React.useState<string>(SettingsTabs.GeneralSettings);

  const SETTINGS_TABS = [
    { name: t("GENERAL_SETTINGS"), value: SettingsTabs.GeneralSettings },
    { name: t("FEATURES"), value: SettingsTabs.Features },
    { name: t("MISC_SETTINGS"), value: SettingsTabs.MiscSettings },
    { name: "Auto set user properties", value: SettingsTabs.AutoSetProperties },
    { name: "API Token", value: SettingsTabs.APIToken },
    { name: "Discord Roles", value: SettingsTabs.DiscordRoles },
    { name: "Discord Webhooks", value: SettingsTabs.DiscordWebhooks },
  ];

  return (
    <AdminLayout>
      <Title>{t("MANAGE_CAD_SETTINGS")}</Title>

      <TabList onValueChange={setActiveTab} tabs={SETTINGS_TABS}>
        <GeneralSettingsTab />

        <Tabs.CADFeaturesTab />
        <Tabs.MiscFeatures />
        <Tabs.AutoSetUserPropertiesTab />
        <Tabs.ApiTokenTab />
        <Tabs.DiscordRolesTab />
        <Tabs.DiscordWebhooksTab canWarn={activeTab === SettingsTabs.DiscordWebhooks} />
      </TabList>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale, res, req }) => {
  const user = await getSessionUser(req);
  const [data] = await requestAll(req, [["/admin/manage/cad-settings", []]]);

  // https://nextjs.org/docs/going-to-production#caching
  res.setHeader("Cache-Control", "public, s-maxage=10, stale-while-revalidate=59");

  return {
    props: {
      cad: data,
      session: user,
      messages: {
        ...(await getTranslations(["admin", "values", "common"], user?.locale ?? locale)),
      },
    },
  };
};
