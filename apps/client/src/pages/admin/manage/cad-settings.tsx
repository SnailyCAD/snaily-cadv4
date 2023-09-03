import type { GetServerSideProps } from "next";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { requestAll } from "lib/utils";
import dynamic from "next/dynamic";
import { GeneralSettingsTab } from "components/admin/manage/cad-settings/general-settings-tab";
import { CadSettingsLayout } from "components/admin/cad-settings/layout";

const Tabs = {
  CADFeaturesTab: dynamic(
    async () =>
      (await import("components/admin/manage/cad-settings/cad-features-tab")).CADFeaturesTab,
    { ssr: false },
  ),
  DefaultPermissionsTab: dynamic(
    async () =>
      (await import("components/admin/manage/cad-settings/default-permissions-tab"))
        .DefaultPermissionsTab,
    { ssr: false },
  ),
  ApiTokenTab: dynamic(
    async () => (await import("components/admin/manage/cad-settings/api-token-tab")).ApiTokenTab,
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
  InactivityTimeoutTab: dynamic(
    async () =>
      (await import("components/admin/manage/cad-settings/misc-features/inactivity-timeout-tab"))
        .InactivityTimeoutTab,
    { ssr: false },
  ),
  CitizenLicenseNumbersTab: dynamic(
    async () =>
      (await import("components/admin/manage/cad-settings/misc-features/license-number-tab"))
        .LicenseNumbersTab,
    { ssr: false },
  ),
  MaxLicensePointsTab: dynamic(
    async () =>
      (await import("components/admin/manage/cad-settings/misc-features/max-license-points-tab"))
        .MaxLicensePointsSection,
    { ssr: false },
  ),
  TemplatesTab: dynamic(
    async () =>
      (await import("components/admin/manage/cad-settings/misc-features/template-tab")).TemplateTab,
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
  return (
    <CadSettingsLayout>
      <GeneralSettingsTab />
      <Tabs.CADFeaturesTab />
      <Tabs.InactivityTimeoutTab />
      <Tabs.MaxLicensePointsTab />
      <Tabs.CitizenLicenseNumbersTab />
      <Tabs.TemplatesTab />
      <Tabs.DefaultPermissionsTab />
      <Tabs.LiveMapTab />
      <Tabs.ApiTokenTab />
      <Tabs.DiscordRolesTab />
      <Tabs.DiscordWebhooksTab />
      <Tabs.RawWebhooksTab />
    </CadSettingsLayout>
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
