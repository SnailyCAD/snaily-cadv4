import { AdminLayout } from "components/admin/AdminLayout";
import { useTranslations } from "use-intl";
import type { GetServerSideProps } from "next";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { TabList } from "@snailycad/ui";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import dynamic from "next/dynamic";
import { GeneralSettingsTab } from "components/admin/manage/cad-settings/general-settings-tab";

const Tabs = {
  CADFeaturesTab: dynamic(
    async () =>
      (await import("components/admin/manage/cad-settings/CADFeaturesTab")).CADFeaturesTab,
    { ssr: false },
  ),
  MiscFeatures: dynamic(
    async () => (await import("components/admin/manage/cad-settings/MiscFeatures")).MiscFeatures,
    { ssr: false },
  ),
  DefaultPermissionsTab: dynamic(
    async () =>
      (await import("components/admin/manage/cad-settings/default-permissions-tab"))
        .DefaultPermissionsTab,
    { ssr: false },
  ),
  ApiTokenTab: dynamic(
    async () => (await import("components/admin/manage/cad-settings/ApiTokenTab")).ApiTokenTab,
    { ssr: false },
  ),
  DiscordRolesTab: dynamic(
    async () =>
      (await import("components/admin/manage/cad-settings/discord-roles-tab")).DiscordRolesTab,
    { ssr: false },
  ),
  DiscordWebhooksTab: dynamic(
    async () =>
      (await import("components/admin/manage/cad-settings/discord-webhooks/discord-webhooks-tab"))
        .DiscordWebhooksTab,
    { ssr: false },
  ),
  RawWebhooksTab: dynamic(
    async () =>
      (await import("components/admin/manage/cad-settings/webhooks/raw-webhooks-tab"))
        .RawWebhooksTab,
    { ssr: false },
  ),
  LiveMapTab: dynamic(
    async () => (await import("components/admin/manage/cad-settings/live-map-tab")).LiveMapTab,
    { ssr: false },
  ),
};

export enum SettingsTabs {
  GeneralSettings = "GENERAL_SETTINGS",
  Features = "FEATURES",
  MiscSettings = "MISC_SETTINGS",
  DefaultPermissions = "DEFAULT_PERMISSIONS",
  LiveMap = "LIVE_MAP",
  APIToken = "API_TOKEN",
  DiscordRoles = "DISCORD_ROLES",
  DiscordWebhooks = "DISCORD_WEBHOOKS",
  RawWebhooks = "RAW_WEBHOOKS",
}

export default function CadSettings() {
  const t = useTranslations("Management");

  const SETTINGS_TABS = [
    { name: t(SettingsTabs.GeneralSettings), value: SettingsTabs.GeneralSettings },
    { name: t(SettingsTabs.Features), value: SettingsTabs.Features },
    { name: t(SettingsTabs.MiscSettings), value: SettingsTabs.MiscSettings },
    { name: t(SettingsTabs.DefaultPermissions), value: SettingsTabs.DefaultPermissions },
    { name: t(SettingsTabs.LiveMap), value: SettingsTabs.LiveMap },
    { name: t(SettingsTabs.APIToken), value: SettingsTabs.APIToken },
    { name: t(SettingsTabs.DiscordRoles), value: SettingsTabs.DiscordRoles },
    { name: t(SettingsTabs.DiscordWebhooks), value: SettingsTabs.DiscordWebhooks },
    { name: t(SettingsTabs.RawWebhooks), value: SettingsTabs.RawWebhooks },
  ];

  return (
    <AdminLayout>
      <Title>{t("MANAGE_CAD_SETTINGS")}</Title>

      <TabList tabs={SETTINGS_TABS}>
        <GeneralSettingsTab />

        <Tabs.CADFeaturesTab />
        <Tabs.MiscFeatures />
        <Tabs.DefaultPermissionsTab />
        <Tabs.LiveMapTab />
        <Tabs.ApiTokenTab />
        <Tabs.DiscordRolesTab />
        <Tabs.DiscordWebhooksTab />
        <Tabs.RawWebhooksTab />
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
        ...(await getTranslations(
          ["admin", "values", "common", "cad-settings"],
          user?.locale ?? locale,
        )),
      },
    },
  };
};
